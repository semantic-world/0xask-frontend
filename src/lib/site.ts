/**
 * Site level constants.
 *
 * The canonical origin is an environment value because it differs between
 * local development, preview, and production, and metadata must never point at
 * the wrong host.
 */

export const SITE = {
  name: "0xSemantic",
  product: "0xAsk",
  title: "0xSemantic",
  tagline: "Engineering portfolio and professional intelligence system",
  description:
    "The engineering work of 0xSemantic. Browse it in Classic, or ask about it directly through 0xAsk.",
  origin: process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000",
} as const;

/**
 * Ownership proofs and the search notification key.
 *
 * All three are environment values because they belong to a deployment rather
 * than to the code, and because an empty one has to mean "not set up" rather
 * than "set up wrongly". A verification tag pointing at somebody else's
 * property is worse than no tag.
 */
export const SEARCH = {
  /** Google Search Console, the meta tag method. */
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  /** Bing Webmaster Tools, the meta tag method. */
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
  /** IndexNow. Served as a text file at the root, containing only itself. */
  indexNowKey: process.env.NEXT_PUBLIC_INDEXNOW_KEY ?? "",
} as const;
