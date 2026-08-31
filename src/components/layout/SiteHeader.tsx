import Link from "next/link";
import { MobileNav } from "@/components/layout/MobileNav";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { NavLink } from "@/components/layout/NavLink";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV = [
  { href: "/projects", label: "Work" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 pad-safe-top border-b border-border-subtle/70 bg-paper/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="shell-width flex h-[var(--header-height)] items-center gap-4">
        <Link
          href="/"
          aria-label="0xSemantic, home"
          className="group flex shrink-0 items-baseline gap-px font-mono text-[0.95rem] font-semibold tracking-tight"
        >
          <span className="text-accent transition-[text-shadow] duration-500 group-hover:[text-shadow:0_0_18px_var(--accent)]">
            0x
          </span>
          <span className="text-ink">Semantic</span>
        </Link>

        <nav aria-label="Primary" className="ml-3 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
