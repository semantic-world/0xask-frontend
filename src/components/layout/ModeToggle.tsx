"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASK_ROUTE, modeForPath } from "@/lib/mode";

/**
 * The signature control of the product.
 *
 * It does not change a colour scheme, it changes how the visitor relates to
 * the same body of work: browse it, or ask about it. The thumb travels with a
 * slight overshoot, which is what makes it read as a physical switch rather
 * than a pair of links that happen to highlight.
 */
export function ModeToggle() {
  const pathname = usePathname();
  const mode = modeForPath(pathname);

  return (
    <nav
      aria-label="Experience mode"
      className="relative isolate flex items-center rounded-full border border-border-subtle bg-surface-sunken/80 p-[3px] backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-[3px] left-[3px] -z-10 w-[calc(50%-3px)] rounded-full bg-surface shadow-[var(--shadow-lift-1)] ring-1 ring-border-subtle transition-transform duration-[520ms] ease-[var(--ease-spring)]"
        style={{ transform: mode === "ask" ? "translateX(100%)" : "translateX(0)" }}
      />
      <Link
        href="/"
        aria-current={mode === "classic" ? "page" : undefined}
        className={`rounded-full px-2.5 py-1.5 text-center text-[0.6875rem] font-medium uppercase tracking-[0.1em] transition-colors duration-300 sm:min-w-[4.5rem] sm:px-3.5 sm:text-[length:var(--text-caption)] ${
          mode === "classic" ? "text-ink" : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        Classic
      </Link>
      <Link
        href={ASK_ROUTE}
        aria-current={mode === "ask" ? "page" : undefined}
        className={`rounded-full px-2.5 py-1.5 text-center font-mono text-[0.6875rem] font-medium tracking-[0.06em] transition-colors duration-300 sm:min-w-[4.5rem] sm:px-3.5 sm:text-[length:var(--text-caption)] ${
          mode === "ask" ? "text-ink" : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        <span className={mode === "ask" ? "text-accent" : ""}>0x</span>Ask
      </Link>
    </nav>
  );
}
