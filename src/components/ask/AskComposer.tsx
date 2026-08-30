"use client";

import { useCallback, useRef, useState } from "react";

const MAX_LENGTH = 500;

type Props = {
  suggestions: readonly string[];
};

/**
 * The 0xAsk input surface.
 *
 * The retrieval and generation pipeline is not connected yet, so submitting
 * reports that plainly instead of producing something that looks like an
 * answer. A portfolio that invents answers is worse than one that says nothing.
 */
export function AskComposer({ suggestions }: Props) {
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  function submit() {
    if (!value.trim()) return;
    setNotice(
      "The knowledge engine is not connected yet, so there is nothing verified to answer from.",
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function applySuggestion(text: string) {
    setValue(text);
    setNotice(null);
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
          submit();
        }}
        className="group relative rounded-[var(--radius-lg)] border border-border-subtle bg-surface transition-colors duration-300 focus-within:border-accent"
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask about the engineering work of 0xSemantic
        </label>

        <textarea
          id="ask-input"
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value.slice(0, MAX_LENGTH));
            setNotice(null);
            resize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Ask anything about the work..."
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          spellCheck
          className="scroll-contained block w-full resize-none bg-transparent px-5 pb-14 pt-4 text-[length:var(--text-lead)] leading-relaxed outline-none placeholder:text-ink-faint"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-3">
          <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
            {value.length > 0 ? `${value.length}/${MAX_LENGTH}` : "Enter to send"}
          </span>

          <button
            type="submit"
            disabled={!value.trim()}
            className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-[var(--radius)] bg-accent px-4 text-[var(--text-small)] font-medium text-accent-ink transition-all duration-300 ease-[var(--ease-out)] disabled:cursor-not-allowed disabled:opacity-35 enabled:active:scale-[0.97]"
          >
            Ask
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </form>

      {notice ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-[var(--radius)] border border-border-subtle bg-surface-sunken px-4 py-3 text-[var(--text-small)] text-ink-muted"
        >
          <span aria-hidden="true" className="mt-px font-mono text-caution">
            !
          </span>
          {notice}
        </p>
      ) : null}

      <div className="mt-7">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
          Try
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => applySuggestion(suggestion)}
                className="rounded-full border border-border-subtle px-3.5 py-1.5 text-left text-[var(--text-small)] text-ink-muted transition-all duration-200 hover:border-border-strong hover:text-ink active:scale-[0.97]"
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
