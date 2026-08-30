import type { MetadataRoute } from "next";
import { getStatus } from "@/lib/server-api";
import { SITE } from "@/lib/site";

/**
 * Generated per request, because whether the site should be indexed at all
 * depends on whether it is published, and that changes from the console.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const status = await getStatus();

  if (!status.published) {
    // Nothing is published, so nothing should be crawled. Saying so is more
    // reliable than letting a crawler discover a site of 404s and form its own
    // opinion about the domain.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The control room and the API are not content. The conversational
        // surface is excluded because crawling it would cost a model call per
        // request and produce nothing indexable.
        disallow: ["/admin", "/admin/", "/api/", "/ask", "/offline"],
      },
    ],
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
