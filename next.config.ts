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
const securityHeaders = [
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
