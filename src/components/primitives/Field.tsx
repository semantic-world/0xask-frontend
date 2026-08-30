"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

const CONTROL =
  "w-full rounded-[var(--radius)] border border-border-subtle bg-surface px-3 py-2 text-[length:var(--text-small)] outline-none transition-colors duration-200 placeholder:text-ink-faint focus:border-accent disabled:opacity-50";

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-faint"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[var(--text-caption)] text-critical">{error}</p>
      ) : hint ? (
        <p className="text-[var(--text-caption)] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, className = "", ...rest }: InputProps) {
  const generated = useId();
  const id = rest.id ?? generated;

  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} ${error ? "border-critical" : ""} ${className}`}
        {...rest}
      />
    </Wrapper>
  );
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextArea({ label, hint, error, className = "", rows = 4, ...rest }: AreaProps) {
  const generated = useId();
  const id = rest.id ?? generated;

  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} scroll-contained resize-y leading-relaxed ${error ? "border-critical" : ""} ${className}`}
        {...rest}
      />
    </Wrapper>
  );
}

type SelectProps = {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
  id?: string;
};

export function SelectField({
  label,
  hint,
  error,
  value,
  onChange,
  options,
  disabled,
  id,
}: SelectProps) {
  const generated = useId();
  const controlId = id ?? generated;

  return (
    <Wrapper id={controlId} label={label} hint={hint} error={error}>
      <select
        id={controlId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} appearance-none`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[length:var(--text-small)] font-medium">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-[var(--text-caption)] text-ink-faint">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-45 ${
          checked ? "bg-accent" : "bg-border-strong"
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute top-1 size-4 rounded-full bg-surface shadow-sm transition-transform duration-[280ms] ease-[var(--ease-spring)]"
          style={{ transform: checked ? "translateX(1.5rem)" : "translateX(0.25rem)" }}
        />
      </button>
    </div>
  );
}
