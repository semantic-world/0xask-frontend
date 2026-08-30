import type { ReactNode } from "react";

type Tone = "neutral" | "positive" | "caution" | "critical" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "border-border-subtle text-ink-muted",
  positive: "border-positive/35 text-positive",
  caution: "border-caution/35 text-caution",
  critical: "border-critical/35 text-critical",
  accent: "border-accent/40 text-accent",
};

/**
 * Visibility and status read as colour before they read as text, so the tone
 * mapping lives in one place and every table agrees.
 */
const VISIBILITY_TONE: Record<string, Tone> = {
  PUBLIC: "positive",
  PORTFOLIO: "accent",
  RESTRICTED: "caution",
  PRIVATE: "critical",
  SECRET: "critical",
};

const STATUS_TONE: Record<string, Tone> = {
  APPROVED: "positive",
  PUBLISHED: "positive",
  PENDING: "caution",
  REVIEW: "caution",
  DRAFT: "neutral",
  DISCOVERED: "neutral",
  ANALYZED: "neutral",
  REJECTED: "critical",
  BLOCKED: "critical",
  SUPERSEDED: "neutral",
  SUCCEEDED: "positive",
  RUNNING: "accent",
  FAILED: "critical",
  CANCELLED: "neutral",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function VisibilityBadge({ level }: { level: string }) {
  return <Badge tone={VISIBILITY_TONE[level] ?? "neutral"}>{level}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}
