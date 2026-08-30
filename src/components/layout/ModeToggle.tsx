"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASK_ROUTE, modeForPath } from "@/lib/mode";

/**
 * The signature control of the product. It does not change a colour scheme, it
 * changes how the visitor relates to the same body of work: browse it, or ask
 * about it.
 */
export function ModeToggle() {
  const pathname = usePathname();
  const mode = modeForPath(pathname);

  return (
    <nav
      aria-label="Experience mode"
      className="relative isolate flex items-center rounded-full border border-border-subtle bg-surface-sunken p-0.5"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 -z-10 w-[calc(50%-0.125rem)] rounded-full bg-surface shadow-sm ring-1 ring-border-subtle transition-transform duration-[420ms] ease-[var(--ease-spring)]"
        style={{ transform: mode === "ask" ? "translateX(100%)" : "translateX(0)" }}
      />
      <Link
        href="/"
        aria-current={mode === "classic" ? "page" : undefined}
        className={`min-w-[4.75rem] rounded-full px-3 py-1.5 text-center text-[var(--text-caption)] font-medium uppercase tracking-[0.09em] transition-colors duration-200 ${
          mode === "classic" ? "text-ink" : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        Classic
      </Link>
      <Link
        href={ASK_ROUTE}
        aria-current={mode === "ask" ? "page" : undefined}
        className={`min-w-[4.75rem] rounded-full px-3 py-1.5 text-center font-mono text-[var(--text-caption)] font-medium tracking-[0.06em] transition-colors duration-200 ${
          mode === "ask" ? "text-ink" : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        0xAsk
      </Link>
    </nav>
  );
}
