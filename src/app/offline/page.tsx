import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-20">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
        No connection
      </p>
      <h1 className="mt-5 max-w-[20ch] text-[length:var(--text-h1)] font-medium">
        This page has not been read on this device yet.
      </h1>
      <p className="mt-6 max-w-[52ch] text-ink-muted">
        Pages you have already visited stay available offline. 0xAsk needs a connection, because an
        answer given from stale knowledge is an answer that might be wrong.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-[var(--radius)] border border-border-strong px-6 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          Back to the start
        </Link>
      </div>
    </div>
  );
}
