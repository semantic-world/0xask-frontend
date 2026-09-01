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

/**
 * The work, as a list a search engine can read as one.
 *
 * A listing page without this is a page of links. With it, the collection
 * itself is an entity, and the ordering is a statement about which work the
 * owner leads with rather than an accident of the markup.
 */
export function projectListSchema(
  projects: Array<{ slug: string; name: string; tagline: string | null }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE.origin}/projects#list`,
    name: "Engineering work",
    numberOfItems: projects.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE.origin}/projects/${project.slug}`,
      name: project.name,
      ...(project.tagline ? { description: project.tagline } : {}),
    })),
  };
}

/**
 * The about page, as a page about a person rather than a page that mentions one.
 *
 * `ProfilePage` is the type search engines use to decide that a page is the
 * authoritative description of an entity, which is exactly what this one is.
 */
export function profilePageSchema(profile: Profile): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE.origin}/about#profile`,
    url: `${SITE.origin}/about`,
    name: profile.full_name,
    description: profile.summary ?? profile.headline,
    mainEntity: { "@id": `${SITE.origin}/#person` },
    isPartOf: { "@id": `${SITE.origin}/#website` },
  };
}

/**
 * What the person actually knows, tied to what demonstrates it.
 *
 * `knowsAbout` is the property that carries a person's expertise into an
 * entity graph. Emitted from the same records the skills page renders, so it
 * cannot claim a competence the site does not show evidence for.
 */
export function expertiseSchema(
  profile: Profile,
  skills: Array<{ name: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: profile.full_name,
    ...(skills.length ? { knowsAbout: skills.map((skill) => skill.name) } : {}),
  };
}
