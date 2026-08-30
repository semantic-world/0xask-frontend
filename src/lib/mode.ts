/**
 * The two interaction paradigms.
 *
 * Mode is derived from the route rather than held in client state, so a shared
 * link always opens in the right experience and a crawler sees a real page.
 */

export type Mode = "classic" | "ask";

export const ASK_ROUTE = "/ask";

export function modeForPath(pathname: string): Mode {
  return pathname === ASK_ROUTE || pathname.startsWith(`${ASK_ROUTE}/`) ? "ask" : "classic";
}
