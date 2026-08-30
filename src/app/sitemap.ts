import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Static routes only for now. Project pages are added from the published
 * project registry once the public API exists, so the sitemap always reflects
 * what is actually approved rather than what merely exists.
 */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/ask", priority: 0.9, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.7, changeFrequency: "monthly" },
  { path: "/skills", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resume", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE.origin}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
