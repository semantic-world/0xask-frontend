import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/**
 * Rendered per request.
 *
 * Not for freshness, which the client fetches anyway, but because the content
 * security policy uses a per request nonce. A statically prerendered page is
 * generated before middleware runs, so its scripts carry no nonce and a strict
 * policy blocks them.
 */
export const dynamic = "force-dynamic";

/**
 * What the service worker serves when there is no network and no usable cached
 * copy of the page that was asked for.
 *
 * Static on purpose. It is precached at install time, so it has to be
 * renderable without reaching the API, which is exactly the situation it
 * exists for.
 */
export default function OfflinePage() {
  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-20">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
        No connection
      </p>

      <h1 className="mt-5 max-w-[20ch] text-[length:var(--text-h1)] font-medium">
        This page is not available offline.
      </h1>

      <p className="mt-6 max-w-[54ch] text-ink-muted">
        Pages you have already read stay available for a week without a connection. This one has
        either not been opened on this device, or the copy is old enough that showing it could be
        misleading.
      </p>

      <p className="mt-4 max-w-[54ch] text-[var(--text-small)] text-ink-faint">
        0xAsk always needs a connection. An answer assembled from knowledge that may since have been
        withdrawn is an answer that might be wrong, so it is never served from a cache.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-[var(--radius)] border border-border-strong px-6 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          Back to the start
        </Link>
        <Link
          href="/projects"
          className="inline-flex h-12 items-center rounded-[var(--radius)] border border-border-strong px-6 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          Selected work
        </Link>
      </div>
    </div>
  );
}
