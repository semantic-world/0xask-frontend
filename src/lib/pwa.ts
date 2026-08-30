"use client";

/**
 * Progressive web application helpers.
 *
 * The install prompt is captured rather than triggered. Browsers only fire
 * `beforeinstallprompt` when they judge the site worth installing, and calling
 * `prompt()` outside a user gesture is refused, so the only correct pattern is
 * to hold the event and use it when someone asks.
 */

export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const DISMISSED_KEY = "0xask.install.dismissed";

/** Whether the page is running as an installed application. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // iOS reports this on navigator rather than through a media query.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    iosStandalone === true
  );
}

/** iOS has no install prompt at all, so it needs instructions instead. */
export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;

  const agent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(agent) || (agent.includes("Mac") && "ontouchend" in document);
  const isSafari = /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS/.test(agent);

  return isIos && isSafari;
}

export function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Storage can throw in a private window. Showing the prompt again is a
    // better failure than never showing it.
    return false;
  }
}

export function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // The choice still applies for this session.
  }
}
