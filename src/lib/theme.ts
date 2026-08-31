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

/**
 * Watch the system setting while "system" is the choice.
 *
 * Without this, a visitor whose device switches to dark at sunset keeps
 * looking at a light page until they reload, which is the one thing choosing
 * "system" was meant to avoid.
 *
 * Returns a function that stops watching.
 */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Which appearance is actually on screen, whatever the stored choice is. */
export function resolvedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = readStoredTheme();
  if (stored !== "system") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** The colours the browser paints its own chrome with, per appearance. */
const CHROME_COLOUR: Record<"light" | "dark", string> = {
  light: "#fbfaf7",
  dark: "#0a0b0d",
};

/**
 * Keep the browser chrome matching the page.
 *
 * The meta tag in the document uses a media query, which follows the system
 * and cannot see an explicit choice. Without this, choosing dark on a light
 * system leaves a pale bar above a dark page, which on a phone is the most
 * visible part of the window.
 */
function syncChromeColour(): void {
  const colour = CHROME_COLOUR[resolvedTheme()];

  for (const tag of document.querySelectorAll('meta[name="theme-color"]')) {
    tag.setAttribute("content", colour);
    // The media attribute would otherwise keep overriding this from the
    // system setting the moment it changes.
    tag.removeAttribute("media");
  }
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

  syncChromeColour();
}
