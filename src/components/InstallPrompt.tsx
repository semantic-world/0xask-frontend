"use client";

import { useEffect, useState } from "react";
import {
  isIosSafari,
  isStandalone,
  type InstallPrompt as Prompt,
  rememberDismissal,
  wasDismissed,
} from "@/lib/pwa";

/**
 * An unobtrusive invitation to install.
 *
 * Shown only when the browser has already decided the site is installable, and
 * never again once dismissed. iOS fires no install event at all, so it gets a
 * short instruction instead of a button that could not work.
 */
export function InstallPrompt() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      // Held rather than fired. The browser refuses prompt() outside a gesture.
      event.preventDefault();
      setPrompt(event as Prompt);
      setHidden(false);
    };

    const onInstalled = () => {
      setPrompt(null);
      setHidden(true);
      rememberDismissal();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) {
      // Delayed, so it does not compete with the page a visitor just opened.
      const timer = setTimeout(() => {
        setShowIosHint(true);
        setHidden(false);
      }, 12_000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!prompt && !showIosHint)) return null;

  function dismiss() {
    setHidden(true);
    rememberDismissal();
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    setHidden(true);
  }

  return (
    <aside
      aria-label="Install this site"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised px-4 py-3 shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-small)] font-medium">
            {showIosHint ? "Add to your home screen" : "Install this portfolio"}
          </p>
          <p className="mt-0.5 text-[var(--text-caption)] text-ink-faint">
            {showIosHint
              ? "Share, then Add to Home Screen."
              : "Opens standalone and works offline for pages you have read."}
          </p>
        </div>

        {prompt ? (
          <button
            type="button"
            onClick={() => void install()}
            className="shrink-0 rounded-[var(--radius)] bg-accent px-3.5 py-2 text-[var(--text-caption)] font-medium text-accent-ink transition-transform active:scale-95"
          >
            Install
          </button>
        ) : null}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </aside>
  );
}
