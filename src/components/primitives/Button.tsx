"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-border-strong text-ink hover:border-accent hover:text-accent bg-transparent",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "border border-critical/40 text-critical hover:bg-critical/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[var(--text-caption)]",
  md: "h-10 px-4 text-[var(--text-small)]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  busy = false,
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-200 ease-[var(--ease-out)] disabled:cursor-not-allowed disabled:opacity-45 enabled:active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
