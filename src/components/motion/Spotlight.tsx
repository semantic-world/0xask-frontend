"use client";

import { type ReactNode, useCallback, useRef } from "react";

/**
 * A container whose border brightens where the pointer is.
 *
 * Position is written to a CSS custom property rather than to React state.
 * Re-rendering on every pointer move would be the most expensive thing on the
 * page, and the browser can already animate a custom property without help.
 *
 * Pointer only. There is nothing here for a keyboard user to miss, and the
 * focus ring does that job properly.
 */
export function Spotlight({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number>(0);

  const track = useCallback((event: React.PointerEvent) => {
    const element = ref.current;
    if (!element) return;

    // Coalesced into one frame. Pointer events arrive faster than the screen
    // refreshes, and doing this work per event is work thrown away.
    cancelAnimationFrame(frame.current);
    const { clientX, clientY } = event;

    frame.current = requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--pointer-x", `${clientX - bounds.left}px`);
      element.style.setProperty("--pointer-y", `${clientY - bounds.top}px`);
    });
  }, []);

  return (
    <Tag ref={ref as never} onPointerMove={track} className={`spotlight ${className}`}>
      {children}
    </Tag>
  );
}
