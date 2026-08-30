import type { MetadataRoute } from "next";
import { getProjects, getStatus } from "@/lib/server-api";
import { SITE } from "@/lib/site";

/**
 * The sitemap, built from what is actually published.
 *
 * Project pages are the reason this exists. They are the substance of the
 * portfolio, and a sitemap that lists the navigation but not the work is doing
 * half the job.
 *
 * Generated per request rather than at build time, because what is published
 * changes from the console and a sitemap that lags is worse than none: it
 * points a crawler at pages that now return 404.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// `/ask` is deliberately absent, because robots.txt disallows it. Listing a
// disallowed address in a sitemap is a contradiction, and search engines
// report it as one.
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.7, changeFrequency: "monthly" },
  { path: "/skills", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resume", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const status = await getStatus();

  // An unpublished site has nothing to offer a crawler, and listing routes
  // that all return 404 is worse than listing nothing.
  if (!status.published) return [];

  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE.origin}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const projects = await getProjects();

    for (const project of projects) {
      entries.push({
        url: `${SITE.origin}/projects/${project.slug}`,
        // When it was published, not when this was generated. A crawler uses
        // this to decide whether to bother, and a timestamp that always says
        // "just now" teaches it to ignore the field.
        lastModified: project.published_at ? new Date(project.published_at) : now,
        changeFrequency: "monthly",
        priority: project.is_featured ? 0.9 : 0.7,
      });
    }
  } catch {
    // The static routes are still worth serving if the API is unreachable.
  }

  return entries;
}
