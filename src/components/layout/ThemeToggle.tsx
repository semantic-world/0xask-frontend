"use client";

import { useEffect, useState } from "react";
import { applyTheme, readStoredTheme, type Theme } from "@/lib/theme";

const ORDER: Theme[] = ["system", "light", "dark"];

const LABEL: Record<Theme, string> = {
  system: "Match system appearance",
  light: "Light appearance",
  dark: "Dark appearance",
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    setReady(true);
  }, []);

  function advance() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={advance}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-ink-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
    >
      <span aria-hidden="true" className="text-[0.9rem]">
        {ready ? { system: "◐", light: "○", dark: "●" }[theme] : "◐"}
      </span>
    </button>
  );
}
