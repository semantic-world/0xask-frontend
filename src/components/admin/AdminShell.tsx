"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useSession } from "@/components/admin/SessionProvider";
import { Button } from "@/components/primitives/Button";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/knowledge", label: "Knowledge" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/github", label: "GitHub" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/policies", label: "Policies" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, signOut } = useSession();
  const [navOpen, setNavOpen] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !session && !isLogin) router.replace("/admin/login");
  }, [loading, session, isLogin, router]);

  // Close the drawer whenever the route changes, so a tap on a link does not
  // leave it hanging open behind the new page. The pathname is the trigger
  // rather than something the effect reads.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isLogin) return <>{children}</>;

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-faint">
          Checking session
        </p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border-subtle bg-paper/85 px-4 pad-safe-top backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <span aria-hidden="true">{navOpen ? "✕" : "≡"}</span>
          <span className="sr-only">Navigation</span>
        </button>
        <span className="font-mono text-[var(--text-small)] font-semibold">
          <span className="text-accent">0x</span>Ask
        </span>
      </header>

      <nav
        id="admin-nav"
        aria-label="Console"
        className={`${
          navOpen ? "block" : "hidden"
        } shrink-0 border-b border-border-subtle bg-surface px-3 py-3 lg:sticky lg:top-0 lg:block lg:h-svh lg:w-56 lg:border-b-0 lg:border-r lg:py-6`}
      >
        <div className="mb-6 hidden px-3 lg:block">
          <Link href="/" className="font-mono text-[0.95rem] font-semibold">
            <span className="text-accent">0x</span>Ask
          </Link>
          <p className="mt-0.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
            Control room
          </p>
        </div>

        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-small)] transition-colors duration-150 ${
                    active
                      ? "bg-accent-wash font-medium text-ink"
                      : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-border-subtle px-3 pt-4">
          <p className="truncate text-[var(--text-caption)] text-ink-faint">{session.user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </nav>

      <main className="min-w-0 flex-1 px-4 py-6 pad-safe-bottom sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[length:var(--text-h2)] font-medium">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-[68ch] text-[var(--text-small)] text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
