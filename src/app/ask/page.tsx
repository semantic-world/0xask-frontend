import type { Metadata } from "next";
import { AskComposer } from "@/components/ask/AskComposer";

export const metadata: Metadata = {
  title: "0xAsk",
  description:
    "Ask about the engineering work of 0xSemantic. Answers come from curated, approved knowledge and cite their evidence.",
};

const SUGGESTIONS = [
  "What has he built?",
  "Show me his AI infrastructure work",
  "Has he built distributed systems?",
  "What blockchain experience does he have?",
  "What are his strongest projects?",
  "Why hire him as an AI engineer?",
];

export default function AskPage() {
  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-center font-mono text-[var(--text-caption)] uppercase tracking-[0.2em] text-ink-faint">
          0xAsk
        </p>
        <h1 className="mt-5 text-center text-[length:var(--text-h1)] font-medium">
          Ask about the work
        </h1>
        <p className="mx-auto mt-5 max-w-[46ch] text-center text-ink-muted">
          This is not a general assistant. It answers from a curated body of approved knowledge,
          cites the evidence behind every claim, and says so when the evidence is not there.
        </p>

        <div className="mt-10">
          <AskComposer suggestions={SUGGESTIONS} />
        </div>
      </div>
    </div>
  );
}
