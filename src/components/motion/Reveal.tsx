"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Content that arrives as it is scrolled to.
 *
 * The hidden state is applied by this component after it mounts, never in the
 * server rendered HTML. A page reaching a visitor with JavaScript disabled, or
 * before hydration, therefore shows everything: the worst case is no
 * animation, not an empty page.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Milliseconds, for staggering a row. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    // Armed only once the observer is known to work, so the hidden state is
    // never applied without something to undo it.
    setArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          // One direction only. Content that fades out again as you scroll
          // past is a page fighting the reader.
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${armed ? "reveal" : ""} ${className}`}
      data-shown={shown ? "true" : undefined}
      style={delay && armed ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
