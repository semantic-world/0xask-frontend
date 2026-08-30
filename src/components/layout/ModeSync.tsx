"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { modeForPath } from "@/lib/mode";

/**
 * Mirrors the route derived mode onto the root element so the whole design
 * system can shift identity from one attribute.
 */
export function ModeSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", modeForPath(pathname));
  }, [pathname]);

  return null;
}
