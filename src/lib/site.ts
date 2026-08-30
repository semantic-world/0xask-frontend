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
