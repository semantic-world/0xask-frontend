import { type NextRequest, NextResponse } from "next/server";

/**
 * Where the API lives, read per request.
 *
 * This has to happen here rather than through a rewrite in next.config.ts.
 * With standalone output the config is evaluated at build time and frozen into
 * the server bundle, so a rewrite target read from the environment is baked in
 * as whatever it was on the build machine. In a container that means the
 * runtime BACKEND_ORIGIN is silently ignored and every API call goes to
 * localhost, which is nothing.
 *
 * Addressed by literal IPv4 by default rather than "localhost", which resolves
 * to ::1 first on most Linux hosts while the API server binds IPv4.
 */
function backendOrigin(): string {
  return process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";
}

export function middleware(request: NextRequest) {
  // The API is proxied through this origin so the browser never talks cross
  // origin and the session cookie stays first party. The API sets its own
  // headers, so nothing here is added to it.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, backendOrigin());
    return NextResponse.rewrite(target);
  }

  // The IndexNow key file.
  //
  // The protocol asks that the key be fetchable at the host being claimed, as
  // proof that whoever submits addresses controls the site. It lives here
  // rather than in `public/` so the key stays an environment value: a key
  // committed to a repository is one that has to be rotated the moment the
  // repository goes public, which this one is about to.
  //
  // Only the configured name answers. Any other is a 404, so this cannot be
  // used to discover whether a key is set or what it is.
  const indexNowKey = process.env.NEXT_PUBLIC_INDEXNOW_KEY;
  if (indexNowKey && request.nextUrl.pathname === `/${indexNowKey}.txt`) {
    return new NextResponse(indexNowKey, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }

  // The content security policy is a static header now, set in
  // `next.config.ts`. See the note there for why it stopped being generated
  // per request.
  return NextResponse.next();
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
