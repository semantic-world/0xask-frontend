import Link from "next/link";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border-subtle pad-safe-bottom">
      <div className="shell-width flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-ink-faint">
          0xSemantic
          <span className="mx-2 text-border-strong">/</span>
          {YEAR}
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {[
            { href: "/work", label: "Work" },
            { href: "/resume", label: "Resume" },
            { href: "/contact", label: "Contact" },
            { href: "/ask", label: "0xAsk" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[var(--text-small)] text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
