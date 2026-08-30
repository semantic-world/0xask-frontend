import { type NextRequest, NextResponse } from "next/server";
import { themeBootScript } from "@/lib/theme";

/**
 * Applies the content security policy with a per request nonce.
 *
 * A nonce has to be generated per response, which a static header cannot do,
 * so this is the one thing that genuinely needs middleware. Next reads the
 * nonce from this header and stamps it onto the scripts it emits.
 */
/**
 * The policy hash for the inline theme script.
 *
 * Computed from the script itself rather than written down beside it. A hash
 * copied into a constant goes stale the moment anyone edits the script, and it
 * fails silently in production: the browser blocks the script and every
 * visitor sees the wrong theme for a frame. Deriving it removes the failure
 * mode rather than adding a check for it.
 *
 * Computed once and held, because the script is a build time constant.
 */
let themeScriptHash: string | null = null;

async function hashThemeScript(): Promise<string> {
  if (themeScriptHash) return themeScriptHash;

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(themeBootScript));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  themeScriptHash = `sha256-${btoa(binary)}`;
  return themeScriptHash;
}

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isProduction = process.env.NODE_ENV === "production";

  /**
   * `'self'` rather than `'strict-dynamic'`, deliberately.
   *
   * strict-dynamic is the stronger expression and it was tried first. It
   * requires every script to carry a nonce, and Next always prerenders the not
   * found page, which is generated before middleware runs and therefore has no
   * nonce to carry. The result was a 404 that rendered correctly and never
   * hydrated, which is a page knowingly shipped broken.
   *
   * What `'self'` gives up is protection against an injected script tag
   * pointing at a same origin URL. This origin serves no uploads, no user
   * generated content, and no third party scripts, so every same origin script
   * is our own build output. Inline injection and any cross origin script are
   * still refused, which is where the real exposure would be.
   */
  const scriptSrc = isProduction
    ? `'self' 'nonce-${nonce}' '${await hashThemeScript()}'`
    : "'self' 'unsafe-inline' 'unsafe-eval'";

  const policy = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Next emits inline style attributes with no nonce path. Styles cannot
    // exfiltrate the way a script can, so this is the concession worth making.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);

  return response;
}

export const config = {
  matcher: [
    // Everything except build output, images, and the worker, none of which
    // execute a script and all of which are requested constantly.
    {
      source: "/((?!_next/static|_next/image|icons|sw\\.js|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
