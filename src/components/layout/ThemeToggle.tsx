"use client";

import { useEffect, useState } from "react";
import { applyTheme, readStoredTheme, type Theme, watchSystemTheme } from "@/lib/theme";

/**
 * Choosing the appearance.
 *
 * Three explicit choices rather than a button that cycles. Cycling had a
 * failure that looked like the control was broken: with the system set to
 * light, moving from "system" to "light" changes the stored preference and
 * nothing else, so a click did nothing a visitor could see. Half the clicks on
 * this control produced no visible change, and which half depended on a system
 * setting the page never showed.
 *
 * Naming each option removes that entirely. One click always lands exactly
 * where it was aimed, and the current choice is visible without hovering.
 */
const OPTIONS: Array<{ value: Theme; hint: string }> = [
  { value: "light", hint: "Always light" },
  { value: "dark", hint: "Always dark" },
  { value: "system", hint: "Follow the system setting" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  // Nothing is marked as selected until the stored value has been read.
  // Rendering a guess and correcting it makes the control flicker into a
  // different state on load, which reads as a bug of its own.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    setReady(true);
    // Applied once on mount so the chrome colour matches whatever was stored,
    // which the document's own meta tag cannot know about.
    applyTheme(stored);

    // While "system" is the choice, a device switching at sunset should be
    // followed rather than waiting for a reload.
    return watchSystemTheme(() => {
      if (readStoredTheme() === "system") applyTheme("system");
    });
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface-sunken/80 p-[3px] backdrop-blur-sm"
    >
      {OPTIONS.map((option) => {
        const selected = ready && theme === option.value;

        return (
          // The ARIA authoring practices build a radiogroup from buttons, and a
          // native radio would have to be stripped of its appearance to end up
          // looking like this anyway.
          // biome-ignore lint/a11y/useSemanticElements: explained just above.
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.hint}
            title={option.hint}
            onClick={() => choose(option.value)}
            className={`grid size-7 place-items-center rounded-full transition-all duration-300 ease-[var(--ease-out)] ${
              selected
                ? "bg-surface text-ink shadow-[var(--shadow-lift-1)] ring-1 ring-border-subtle"
                : "text-ink-faint hover:text-ink-muted"
            }`}
          >
            {/* The button's aria-label names it. A visible label and an
                icon title as well would have it announced three times. */}
            <ThemeIcon theme={option.value} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Icons drawn inline rather than pulled from a set.
 *
 * Three shapes is less code than a dependency, and drawing them here means
 * they inherit the current colour and stroke weight instead of arriving with
 * their own.
 */
function ThemeIcon({ theme }: { theme: Theme }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (theme === "light") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
