import type { Metadata } from "next";
import { AskComposer } from "@/components/ask/AskComposer";

export const metadata: Metadata = {
  title: "0xAsk",
  description:
    "Ask about the engineering work of 0xSemantic. Answers come from curated, approved knowledge and cite their evidence.",
};

/**
 * Rendered per request so the surface reflects whether it can actually answer,
 * which the owner can change at any moment from the console.
 */
export const dynamic = "force-dynamic";

type AskStatus = {
  available: boolean;
  reason: string | null;
  suggestions: string[];
  answerable_claims: number;
};

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const FALLBACK: AskStatus = {
  available: false,
  reason: "0xAsk is not reachable right now.",
  suggestions: [
    "What has he built?",
    "Show me his AI infrastructure work",
    "What are his strongest projects?",
  ],
  answerable_claims: 0,
};

async function getAskStatus(): Promise<AskStatus> {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/api/v1/ask`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return FALLBACK;
    return (await response.json()) as AskStatus;
  } catch {
    return FALLBACK;
  }
}

export default async function AskPage() {
  const status = await getAskStatus();

  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-center font-mono text-[var(--text-caption)] uppercase tracking-[0.2em] text-ink-faint">
          0xAsk
        </p>
        <h1 className="mt-5 text-center text-[length:var(--text-h1)] font-medium">
          Ask about the work
        </h1>
        <p className="mx-auto mt-5 max-w-[48ch] text-center text-ink-muted">
          Not a general assistant. It answers from a curated body of approved knowledge, cites the
          evidence behind every claim, and says so when the evidence is not there.
        </p>

        <div className="mt-10">
          <AskComposer
            suggestions={status.suggestions}
            available={status.available}
            reason={status.reason}
          />
        </div>
      </div>
    </div>
  );
}
