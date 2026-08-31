"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Navigation for every viewport the desktop bar does not cover.
 *
 * Below the large breakpoint the primary nav was hidden and nothing replaced
 * it, so on a phone the only reachable things were the logo and the mode
 * toggle. Every section of the site was a dead end. This is the fix, and it
 * matters most on the viewport the site is meant to feel native on.
 *
 * The sheet closes on a route change, on Escape, and on a tap outside it.
 * While it is open the page behind cannot scroll, and focus moves into the
 * panel so a keyboard or screen reader lands where the eye already is.
 */
export function MobileNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Navigating is the most common way to close it, and the sheet must not
  // survive into the page it just sent you to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: closing is the effect, the route is the trigger.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={trigger}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((was) => !was)}
        className="grid size-9 place-items-center rounded-full border border-border-subtle bg-surface-sunken/80 text-ink-muted backdrop-blur-sm transition-colors duration-300 hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {/* Rendered whether open or not, so the transition has something to
          move between, and hidden from assistive technology when closed. */}
      <div
        id="mobile-nav"
        inert={!open}
        className={`fixed inset-0 top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-40 transition-opacity duration-300 ease-[var(--ease-out)] ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="absolute inset-0 h-full w-full cursor-default bg-paper/60 backdrop-blur-sm"
        />

        <div
          ref={panel}
          // Opaque rather than translucent. The rest of the chrome is
          // deliberately see through, but a panel of links over a page of
          // large display type is the one place where that costs legibility
          // and buys nothing.
          className={`relative border-b border-border-subtle bg-paper shadow-[var(--shadow-lift-3)] transition-transform duration-300 ease-[var(--ease-out)] ${
            open ? "translate-y-0" : "-translate-y-3"
          }`}
        >
          <nav aria-label="Primary" className="shell-width py-3">
            <ul>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between border-b border-border-subtle/60 py-3.5 text-[length:var(--text-h4)] transition-colors duration-200 last:border-b-0 ${
                        active ? "text-accent" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={active ? "text-accent" : "text-ink-faint"}
                      >
                        &rarr;
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
