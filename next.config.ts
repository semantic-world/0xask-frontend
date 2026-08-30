import type { NextConfig } from "next";

// Addressed by literal IPv4 rather than "localhost", which resolves to ::1
// first on most Linux hosts while the API server binds IPv4 only.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

/**
 * Security headers are set here rather than in a proxy so that they travel
 * with the deployable. The content security policy is deliberately strict and
 * is tightened further during the hardening phase.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const config: NextConfig = {
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

  async rewrites() {
    // The browser talks to the same origin, which keeps cookies first party
    // and removes the need for cross origin credentials in the browser.
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default config;
