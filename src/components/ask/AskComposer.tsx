"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

const MAX_LENGTH = 500;

type Citation = {
  number: number;
  statement: string;
  source_title: string | null;
  source_uri: string | null;
  project_slug: string | null;
  matched_by: string;
  confidence: string;
};

type Result = {
  text: string;
  citations: Citation[];
  refused: boolean;
  mode: string;
  cached: boolean;
};

type Props = {
  suggestions: readonly string[];
  available: boolean;
  reason: string | null;
};

/**
 * The 0xAsk input surface.
 *
 * Answers arrive as server sent events. Evidence is emitted before the text,
 * so citations appear as soon as retrieval finishes rather than after the
 * whole answer is composed.
 */
export function AskComposer({ suggestions, available, reason }: Props) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, []);

  async function submit() {
    const question = value.trim();
    if (!question || asking || !available) return;

    setAsking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/ask", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "That did not work. Try again shortly.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const collected: Result = {
        text: "",
        citations: [],
        refused: false,
        mode: "generated",
        cached: false,
      };

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;

        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split("\n\n");
        // The last fragment may be a partial event, so it stays in the buffer.
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const nameLine = raw.split("\n").find((line) => line.startsWith("event: "));
          const dataLine = raw.split("\n").find((line) => line.startsWith("data: "));
          if (!nameLine || !dataLine) continue;

          const name = nameLine.slice(7).trim();
          const data = JSON.parse(dataLine.slice(6));

          if (name === "evidence") {
            collected.citations = data.citations ?? [];
            setResult({ ...collected });
          } else if (name === "answer") {
            collected.text = data.text ?? "";
            setResult({ ...collected });
          } else if (name === "done") {
            collected.refused = Boolean(data.refused);
            collected.mode = data.mode ?? "generated";
            collected.cached = Boolean(data.cached);
            setResult({ ...collected });
          }
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setAsking(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function applySuggestion(text: string) {
    setValue(text);
    setError(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      resize();
    });
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="group relative rounded-[var(--radius-xl)] border border-border-subtle bg-surface/80 shadow-[var(--shadow-lift-2)] backdrop-blur-sm transition-all duration-500 ease-[var(--ease-out)] focus-within:border-accent focus-within:shadow-[var(--shadow-glow)]"
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask about the engineering work of 0xSemantic
        </label>

        <textarea
          id="ask-input"
          ref={textareaRef}
          value={value}
          disabled={!available}
          onChange={(event) => {
            setValue(event.target.value.slice(0, MAX_LENGTH));
            setError(null);
            resize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={available ? "Ask anything about the work..." : "Not answering yet"}
          enterKeyHint="send"
          autoComplete="off"
          spellCheck
          className="scroll-contained block w-full resize-none bg-transparent px-5 pb-14 pt-4 text-[length:var(--text-lead)] leading-relaxed outline-none placeholder:text-ink-faint disabled:opacity-60"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-3">
          <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
            {value.length > 0 ? `${value.length}/${MAX_LENGTH}` : "Enter to send"}
          </span>

          <button
            type="submit"
            disabled={!value.trim() || asking || !available}
            className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[var(--text-small)] font-medium text-accent-ink shadow-[var(--shadow-lift-1)] transition-all duration-300 ease-[var(--ease-out)] disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:shadow-[var(--shadow-glow)] enabled:active:scale-[0.97]"
          >
            {asking ? "Thinking" : "Ask"}
            <span aria-hidden="true">
              {asking ? (
                <span className="block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "\u2192"
              )}
            </span>
          </button>
        </div>
      </form>

      {reason ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-[var(--radius)] border border-border-subtle bg-surface-sunken px-4 py-3 text-[var(--text-small)] text-ink-muted"
        >
          <span aria-hidden="true" className="mt-px font-mono text-caution">
            !
          </span>
          {reason}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-[var(--radius)] border border-critical/35 bg-critical/5 px-4 py-3 text-[var(--text-small)] text-critical"
        >
          {error}
        </p>
      ) : null}

      {result ? <AnswerPanel result={result} /> : null}

      <div className="mt-8">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
          Try
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                disabled={!available}
                onClick={() => applySuggestion(suggestion)}
                className="rounded-full border border-border-subtle bg-surface/50 px-3.5 py-1.5 text-left text-[var(--text-small)] text-ink-muted backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:text-ink hover:shadow-[var(--shadow-lift-1)] disabled:opacity-45 disabled:hover:translate-y-0 enabled:active:scale-[0.97]"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AnswerPanel({ result }: { result: Result }) {
  return (
    <section
      aria-live="polite"
      className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface/80 shadow-[var(--shadow-lift-2)] backdrop-blur-sm"
    >
      {result.text ? (
        <div className="border-b border-border-subtle px-5 py-5">
          <p
            className={`max-w-[64ch] whitespace-pre-wrap ${result.refused ? "text-ink-muted" : ""}`}
          >
            {result.text}
          </p>
        </div>
      ) : null}

      {result.citations.length ? (
        <div className="px-5 py-4">
          <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
            {result.mode === "evidence_only" ? "Relevant approved claims" : "Evidence"}
          </p>

          <ol className="mt-3 space-y-3">
            {result.citations.map((citation) => (
              <li key={citation.number} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="tabular mt-0.5 shrink-0 font-mono text-[var(--text-caption)] text-accent"
                >
                  [{citation.number}]
                </span>
                <div className="min-w-0">
                  <p className="max-w-[62ch] text-[var(--text-small)]">{citation.statement}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[var(--text-caption)] text-ink-faint">
                    {citation.project_slug ? (
                      <Link
                        href={`/projects/${citation.project_slug}`}
                        className="text-accent hover:underline"
                      >
                        Read the case study
                      </Link>
                    ) : null}
                    {citation.source_uri ? (
                      <a
                        href={citation.source_uri}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="hover:text-ink-muted"
                      >
                        {citation.source_title ?? "Source"}
                      </a>
                    ) : citation.source_title ? (
                      <span>{citation.source_title}</span>
                    ) : null}
                    <span>matched by {citation.matched_by}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
