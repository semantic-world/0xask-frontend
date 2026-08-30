import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The page for a route that does not exist, and for a project that a visitor
 * is not permitted to see.
 *
 * Deliberately identical in both cases. A page that distinguishes "no such
 * project" from "that project is not published" is a page that can be used to
 * enumerate drafts.
 */
export default function NotFound() {
  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-6rem)] flex-col justify-center py-20">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
        404
      </p>

      <h1 className="mt-5 max-w-[18ch] text-[length:var(--text-h1)] font-medium">
        There is nothing at this address.
      </h1>

      <p className="mt-6 max-w-[52ch] text-ink-muted">
        The page may have moved, or it may never have been published. Either way there is nothing
        here to show you.
      </p>

      <nav aria-label="Elsewhere" className="mt-10 flex flex-wrap gap-3">
        {[
          { href: "/", label: "Home" },
          { href: "/projects", label: "Selected work" },
          { href: "/about", label: "About" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex h-12 items-center rounded-[var(--radius)] border border-border-strong px-6 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
