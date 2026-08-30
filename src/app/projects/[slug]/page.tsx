import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabel } from "@/components/classic/ProjectCard";
import { Prose, TagList } from "@/components/classic/Section";
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

      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink-muted"
        >
          <span aria-hidden="true">&larr;</span>
          All work
        </Link>
      </nav>

      <header className="border-b border-border-subtle pb-12">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-faint">
          {categoryLabel(project.category)}
        </p>

        <h1 className="mt-4 max-w-[18ch] text-[length:var(--text-h1)] font-medium">
          {project.name}
        </h1>

        {project.tagline ? (
          <p className="mt-5 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
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

      {present.map((section) => (
        <section
          key={String(section.field)}
          className="border-t border-border-subtle py-12"
          id={String(section.field)}
        >
          <div className="grid gap-6 lg:grid-cols-[8rem_1fr]">
            <header>
              <p className="font-mono text-[var(--text-caption)] tracking-[0.16em] text-ink-faint">
                {section.eyebrow}
              </p>
              <h2 className="mt-2 text-[length:var(--text-h4)] font-medium">{section.title}</h2>
            </header>
            <Prose text={project[section.field] as string} />
          </div>
        </section>
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
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border-strong px-4 py-2 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
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
