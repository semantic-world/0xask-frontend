"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A navigation link that knows where it is.
 *
 * The current section is marked with a rule beneath it rather than a colour
 * change alone, so it reads at a glance and does not rely on a hue difference
 * a reader may not perceive.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-[var(--radius-sm)] px-3 py-1.5 text-[var(--text-small)] transition-colors duration-200 ${
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 -bottom-px h-px origin-left bg-accent transition-transform duration-300 ease-[var(--ease-out)] ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </Link>
  );
}
