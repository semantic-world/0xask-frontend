import type { Profile, ProjectDetail } from "@/lib/server-api";
import { SITE } from "@/lib/site";

/**
 * Structured data for crawlers.
 *
 * Serialised from records the site already serves, so it can never claim
 * something the visible page does not. That matters more than it sounds:
 * structured data that disagrees with the page is what search engines penalise.
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialised from our own records, never from input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Which link kinds are identities worth asserting as the same person. */
const IDENTITY_KINDS = new Set(["GITHUB", "LINKEDIN", "X", "WRITING"]);

export function personSchema(profile: Profile): Record<string, unknown> {
  const sameAs = profile.links
    .filter((link) => IDENTITY_KINDS.has(link.kind))
    .map((link) => link.url);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: profile.full_name,
    alternateName: profile.handle ?? undefined,
    jobTitle: profile.headline,
    description: profile.summary,
    url: SITE.origin,
    ...(profile.location
      ? { address: { "@type": "PostalAddress", addressLocality: profile.location } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema(profile: Profile): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    url: SITE.origin,
    name: SITE.name,
    description: profile.headline,
    inLanguage: "en",
    publisher: { "@id": `${SITE.origin}/#person` },
  };
}

export function projectSchema(project: ProjectDetail): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    headline: project.tagline ?? project.name,
    description: project.tagline ?? project.summary ?? undefined,
    url: `${SITE.origin}/projects/${project.slug}`,
    ...(project.technologies.length ? { keywords: project.technologies.join(", ") } : {}),
    ...(project.published_at ? { datePublished: project.published_at } : {}),
    ...(project.repository_url ? { codeRepository: project.repository_url } : {}),
    author: { "@id": `${SITE.origin}/#person` },
    creator: { "@id": `${SITE.origin}/#person` },
    isPartOf: { "@id": `${SITE.origin}/#website` },
  };
}

export function breadcrumbSchema(
  trail: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${SITE.origin}${entry.path}`,
    })),
  };
}
