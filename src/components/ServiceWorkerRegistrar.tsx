"use client";

import { useEffect } from "react";

/**
 * Registers the service worker after the page is interactive.
 *
 * Registration is deliberately late and failure is deliberately silent: an
 * offline capability that breaks the first paint is worse than no offline
 * capability at all.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Nothing to recover. The site works without it.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
