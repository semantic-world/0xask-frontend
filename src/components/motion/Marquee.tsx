/**
 * A row of short labels that scrolls itself.
 *
 * The list is rendered twice so the loop meets itself with no seam, and the
 * duplicate is hidden from assistive technology: a screen reader should hear
 * the technologies once, not twice.
 *
 * Server rendered. The animation is CSS, so this costs no client bundle.
 */
export function Marquee({ items, label }: { items: readonly string[]; label: string }) {
  if (!items.length) return null;

  return (
    <div className="edge-fade overflow-hidden py-1">
      <div className="marquee gap-3">
        {["first", "second"].map((pass) => (
          <ul
            key={pass}
            aria-label={pass === "first" ? label : undefined}
            aria-hidden={pass === "second" ? "true" : undefined}
            className="flex shrink-0 items-center gap-3 pr-3"
          >
            {items.map((item) => (
              <li
                key={item}
                className="whitespace-nowrap rounded-full border border-border-subtle bg-surface/60 px-4 py-1.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-muted backdrop-blur-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
