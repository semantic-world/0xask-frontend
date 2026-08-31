import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  action,
  children,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface">
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[length:var(--text-h4)] font-medium">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-[62ch] text-[var(--text-small)] text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "positive" | "caution" | "critical";
  hint?: string;
}) {
  const toneClass = {
    neutral: "text-ink",
    positive: "text-positive",
    caution: "text-caution",
    critical: "text-critical",
  }[tone];

  return (
    <div className="rounded-[var(--radius)] border border-border-subtle bg-surface p-4">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-faint">
        {label}
      </p>
      <p className={`tabular mt-2 text-[length:var(--text-h2)] font-medium ${toneClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[var(--text-caption)] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-[length:var(--text-small)] font-medium text-ink-muted">{title}</p>
      {hint ? (
        <p className="max-w-[46ch] text-[var(--text-caption)] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function ErrorNotice({ message, reasons }: { message: string; reasons?: string[] }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius)] border border-critical/35 bg-critical/5 px-4 py-3"
    >
      <p className="text-[var(--text-small)] text-critical">{message}</p>
      {reasons?.length ? (
        <ul className="mt-2 space-y-1">
          {reasons.map((reason) => (
            <li key={reason} className="text-[var(--text-caption)] text-critical/85">
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  const placeholders = Array.from({ length: rows }, (_, index) => `placeholder-${index}`);

  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="space-y-2 p-5">
      {placeholders.map((id, index) => (
        <div
          key={id}
          className="h-9 animate-pulse rounded-[var(--radius-sm)] bg-surface-sunken"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * A thread of light along the top edge while data is being refetched.
 *
 * The alternative was replacing the panel with a skeleton, which is what made
 * one decision on one row read as a page reload. This says the same thing
 * without taking anything away: the content stays put, stays readable, and
 * stays where the pointer left it.
 */
export function RefreshBar({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" className="relative h-px w-full overflow-hidden bg-transparent">
      <span
        className={`absolute inset-y-0 left-0 w-1/3 bg-accent transition-opacity duration-300 ${
          active ? "animate-[sweep_1.1s_linear_infinite] opacity-70" : "opacity-0"
        }`}
      />
    </div>
  );
}
