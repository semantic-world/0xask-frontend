import type { NextConfig } from "next";

// Addressed by literal IPv4 rather than "localhost", which resolves to ::1
// first on most Linux hosts while the API server binds IPv4 only.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

/**
 * Security headers.
 *
 * Set here rather than in a proxy so they travel with the deployable and
 * cannot be lost by a change to infrastructure nobody remembers owning.
 */
/**
 * The content security policy.
 *
 * Static, and inline scripts are allowed. It was a per request nonce, which is
 * the stronger form and the one Next documents, and it broke the deployed site
 * completely: the nonce reached the response header but not the render, so the
 * browser refused every inline script on the page. Those inline scripts carry
 * the streamed React payload, so the payload never arrived, hydration stopped
 * with "Connection closed", and nothing on the site responded to a tap. The
 * pages looked perfect and were entirely dead.
 *
 * A nonce has to travel from a proxy, through the request, into the render.
 * That worked on one host and not on another, and it had already cost this
 * project a prerendered page that shipped unhydrated for the same reason. A
 * policy whose correctness depends on a header surviving a platform's proxy
 * implementation is not a policy this site should stake itself on.
 *
 * What is given up is protection against an injected inline script. This
 * origin renders no user supplied HTML: visitor questions come back through
 * React as text and are escaped. What is kept is what actually guards this
 * site: no cross origin script may load, no eval in production, no plugins, no
 * framing, and no base tag rewriting.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  // Next emits inline style attributes, and a style cannot exfiltrate the way
  // a script can.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // The API is same origin, through the proxy below.
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // Isolates this origin from other windows it opens or that open it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    // Two years, subdomains included, and preload eligible. Only meaningful
    // over HTTPS, which production is and local development is not.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const config: NextConfig = {
  // Produces a self contained server bundle with only the dependencies it
  // actually uses, so the runtime image carries no node_modules tree.
  output: "standalone",

  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The console is never indexed and never framed, and its responses
        // must not be stored by anything between the server and the browser.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        // The worker must never be cached, otherwise a stale worker can pin an
        // old application shell in place across a deployment.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },

  /**
   * The browser reaches the API through this origin, never directly.
   *
   * That is what keeps the session cookie first party: the console signs in
   * against the site's own host rather than the backend's, so the cookie is
   * same site and no cross origin credentials are involved anywhere.
   *
   * Deleted by mistake while packaging the production image, which broke every
   * client side call in the console. `/api/v1/admin/auth/session` reached the
   * Next application, which has no such route, and the answer was a 500. The
   * console could not tell whether anyone was signed in, and never got as far
   * as offering the form.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default config;
