import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web application manifest.
 *
 * The site installs as a standalone application on every platform that
 * supports it. Shortcuts land directly in the two experiences, because the
 * point of installing is to arrive where you meant to go.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}, ${SITE.tagline}`,
    short_name: SITE.product,
    description: SITE.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    orientation: "any",
    background_color: "#0a0b0d",
    theme_color: "#0a0b0d",
    categories: ["productivity", "business"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Ask about the work",
        short_name: "0xAsk",
        url: "/ask",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Selected work",
        short_name: "Work",
        url: "/projects",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
