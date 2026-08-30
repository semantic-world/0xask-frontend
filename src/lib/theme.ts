/**
 * Theme and mode bootstrapping.
 *
 * This runs before first paint, inline in the document head, so the correct
 * palette is applied without a flash. It is deliberately tiny and dependency
 * free because it blocks rendering.
 */

export const THEME_STORAGE_KEY = "0xask.theme";

export type Theme = "light" | "dark" | "system";

export const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    // Private browsing can throw on storage access. The system preference is
    // a correct fallback, so there is nothing to recover from.
  }
})();
`.trim();

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage unavailable. Fall through to the system preference.
  }
  return "system";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // The choice still applies for this session even if it cannot be stored.
  }
}
