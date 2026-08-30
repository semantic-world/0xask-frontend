"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker and offers a reload when a new one is waiting.
 *
 * Registration is deliberately late and failure is deliberately silent: an
 * offline capability that breaks the first paint is worse than no offline
 * capability at all.
 *
 * The update notice matters more than it looks. A worker that installs
 * silently leaves a visitor on the old application until every tab is closed,
 * which on a phone can be days.
 */
export function ServiceWorkerRegistrar() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const watch = (current: ServiceWorkerRegistration) => {
      if (current.waiting) setWaiting(current.waiting);

      current.addEventListener("updatefound", () => {
        const installing = current.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          // A worker that reaches installed while one is already controlling
          // the page is an update, not a first install.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
          }
        });
      });
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(watch)
        .catch(() => {
          // Nothing to recover. The site works without it.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => window.removeEventListener("load", register);
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border-subtle bg-surface-raised py-2 pl-4 pr-2 shadow-lg">
        <p className="text-[var(--text-caption)] text-ink-muted">A newer version is ready.</p>
        <button
          type="button"
          onClick={() => {
            waiting.postMessage("skip-waiting");
            // The new worker takes control on the next navigation.
            window.location.reload();
          }}
          className="rounded-full bg-accent px-3 py-1.5 text-[var(--text-caption)] font-medium text-accent-ink transition-transform active:scale-95"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
