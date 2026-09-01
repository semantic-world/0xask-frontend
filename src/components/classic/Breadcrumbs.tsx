import Link from "next/link";

/**
 * Where this page sits, said on the page and not only in the markup.
 *
 * The structured data already told a crawler the trail. This tells the person,
 * which is the half that matters more: someone arriving on a case study from a
 * search result has no navigation context at all, and a link back to the work
 * is the difference between a second page view and a bounce.
 *
 * The last entry is the current page and is not a link, because a link to
 * where you already are is noise.
 */
export function Breadcrumbs({ trail }: { trail: Array<{ name: string; path?: string }> }) {
  if (trail.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[var(--text-caption)] text-ink-faint">
        {trail.map((entry, index) => {
          const last = index === trail.length - 1;

          return (
            <li key={entry.name} className="flex items-center gap-1.5">
              {entry.path && !last ? (
                <Link
                  href={entry.path}
                  className="transition-colors duration-300 hover:text-accent"
                >
                  {entry.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-ink-muted">
                  {entry.name}
                </span>
              )}
              {last ? null : (
                <span aria-hidden="true" className="text-ink-faint">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
