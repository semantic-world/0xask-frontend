import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/classic/Breadcrumbs";
import { categoryLabel } from "@/components/classic/ProjectCard";
import { Prose, TagList } from "@/components/classic/Section";
import { Reveal } from "@/components/motion/Reveal";
import { breadcrumbSchema, projectSchema, StructuredData } from "@/components/StructuredData";
import { getProject, type ProjectDetail } from "@/lib/server-api";
import { SITE } from "@/lib/site";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors, which is the opposite of what the invalidation is for.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/**
 * A real, indexable page per project, blueprint section 39.
 *
 * Server rendered with its metadata and structured data, so a search engine
 * understands the work without needing to talk to the conversational surface.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) return { title: "Not found", robots: { index: false } };

  const description = project.tagline ?? project.summary ?? undefined;

  return {
    title: project.name,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.name,
      description,
      url: `${SITE.origin}/projects/${project.slug}`,
    },
  };
}

/** The case study hierarchy from blueprint section 50, in order. */
const SECTIONS: Array<{ field: keyof ProjectDetail; eyebrow: string; title: string }> = [
  { field: "why_it_exists", eyebrow: "01", title: "Why it exists" },
  { field: "what_was_built", eyebrow: "02", title: "What was built" },
  { field: "architecture", eyebrow: "03", title: "Architecture" },
  { field: "contribution", eyebrow: "04", title: "My contribution" },
  { field: "engineering_challenges", eyebrow: "05", title: "Engineering challenges" },
  { field: "result_impact", eyebrow: "06", title: "Result and impact" },
  { field: "lessons", eyebrow: "07", title: "Lessons" },
];

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = await getProject(slug);

  // The same answer whether the project is unpublished or does not exist, so
  // the page cannot be used to discover drafts.
  if (!project) notFound();

  const present = SECTIONS.filter((section) => Boolean(project[section.field]));

  const evidence = [
    project.repository_url ? { label: "Repository", url: project.repository_url } : null,
    project.documentation_url ? { label: "Documentation", url: project.documentation_url } : null,
    project.demo_url ? { label: "Demo", url: project.demo_url } : null,
  ].filter((entry): entry is { label: string; url: string } => entry !== null);

  return (
    <article className="shell-width py-14 sm:py-20">
      <StructuredData data={projectSchema(project)} />
      <StructuredData
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/projects" },
          { name: project.name, path: `/projects/${project.slug}` },
        ])}
      />

      {/* A trail, not a back link. It was labelled as a breadcrumb and was
          one entry, which told a visitor arriving from a search result where
          to go next but not where they were. */}
      <Breadcrumbs
        trail={[
          { name: "Home", path: "/" },
          { name: "Work", path: "/projects" },
          { name: project.name },
        ]}
      />

      <header className="relative border-b border-border-subtle pb-12">
        <span
          aria-hidden="true"
          // Smaller on a phone, where a 26rem circle offset to the left still
          // reaches past the right edge of the screen and makes the whole page
          // scroll sideways for the sake of a decoration nobody can see.
          className="pointer-events-none absolute -left-16 -top-28 -z-10 size-[17rem] rounded-full bg-accent opacity-[0.07] blur-[90px] sm:-left-24 sm:size-[26rem]"
        />

        <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-muted backdrop-blur-sm">
          {categoryLabel(project.category)}
        </p>

        <h1 className="mt-6 max-w-[16ch] text-[length:var(--text-h1)] font-medium leading-[0.98] tracking-[-0.04em]">
          {project.name}
        </h1>

        {project.tagline ? (
          <p className="mt-6 max-w-[56ch] text-[length:var(--text-lead)] leading-relaxed text-ink-muted">
            {project.tagline}
          </p>
        ) : null}

        <dl className="mt-9 grid gap-6 sm:grid-cols-3">
          {project.role ? <Fact label="Role" value={project.role} /> : null}
          {project.started_on ? (
            <Fact
              label="Period"
              value={`${formatYear(project.started_on)} to ${
                project.ended_on ? formatYear(project.ended_on) : "present"
              }`}
            />
          ) : null}
          {project.technologies.length ? (
            <div className="sm:col-span-1">
              <dt className="font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-ink-faint">
                Built with
              </dt>
              <dd className="mt-2">
                <TagList items={project.technologies} label="Technologies" />
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      {project.summary ? (
        <section className="py-12">
          <p className="max-w-[64ch] text-[length:var(--text-lead)]">{project.summary}</p>
        </section>
      ) : null}

      {project.media.length ? (
        <section className="pb-12" aria-label="Screenshots and diagrams">
          <div className="grid gap-4 sm:grid-cols-2">
            {project.media.map((item) => (
              <figure
                key={item.url}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface"
              >
                {/* Intrinsic dimensions where the record has them, so the space
                    is reserved before the image arrives and nothing shifts. */}
                {/* biome-ignore lint/performance/noImgElement: media URLs come
                    from the record and can name any host, which next/image
                    cannot serve without a loader entry per host. */}
                <img
                  src={item.url}
                  alt={item.alt_text}
                  width={item.width ?? undefined}
                  height={item.height ?? undefined}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full"
                />
                {item.alt_text ? (
                  <figcaption className="border-t border-border-subtle px-4 py-2.5 text-[var(--text-caption)] text-ink-faint">
                    {item.alt_text}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {present.map((section, index) => (
        <Reveal
          as="section"
          key={String(section.field)}
          delay={index * 40}
          className="relative border-t border-border-subtle py-14"
        >
          <div id={String(section.field)} className="grid gap-6 lg:grid-cols-[9rem_1fr]">
            <header className="relative lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-1 -top-7 select-none font-mono text-[4.5rem] font-semibold leading-none text-ink opacity-[0.05]"
              >
                {section.eyebrow}
              </span>
              <p className="relative font-mono text-[var(--text-caption)] tracking-[0.18em] text-accent">
                {section.eyebrow}
              </p>
              <h2 className="relative mt-2 text-[length:var(--text-h4)] font-medium tracking-[-0.02em]">
                {section.title}
              </h2>
            </header>
            <Prose text={project[section.field] as string} />
          </div>
        </Reveal>
      ))}

      {evidence.length ? (
        <section className="border-t border-border-subtle py-12">
          <div className="grid gap-6 lg:grid-cols-[8rem_1fr]">
            <header>
              <p className="font-mono text-[var(--text-caption)] tracking-[0.16em] text-ink-faint">
                {String(present.length + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-[length:var(--text-h4)] font-medium">Evidence</h2>
            </header>
            <ul className="flex flex-wrap gap-3">
              {evidence.map((entry) => (
                <li key={entry.url}>
                  <a
                    href={entry.url}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/50 px-5 py-2.5 text-[var(--text-small)] font-medium backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[var(--shadow-glow)]"
                  >
                    {entry.label}
                    <span aria-hidden="true">&#8599;</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-2 text-[var(--text-small)]">{value}</dd>
    </div>
  );
}

function formatYear(value: string): string {
  return new Date(value).getFullYear().toString();
}
