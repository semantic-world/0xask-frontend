import Link from "next/link";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/writing", label: "Writing" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 pad-safe-top border-b border-border-subtle bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="shell-width flex h-[var(--header-height)] items-center gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-baseline gap-px font-mono text-[0.95rem] font-semibold tracking-tight"
        >
          <span className="text-accent transition-colors duration-300">0x</span>
          <span className="text-ink">Semantic</span>
        </Link>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[var(--text-small)] text-ink-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
