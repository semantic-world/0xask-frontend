import Link from "next/link";
import { ProjectCardLink } from "@/components/classic/ProjectCard";
import { EmptyNotice, Section } from "@/components/classic/Section";
import { personSchema, StructuredData, websiteSchema } from "@/components/StructuredData";
import { getProfile, getProjects, getStatus } from "@/lib/server-api";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors, which is the opposite of what the invalidation is for.
 */
export const dynamic = "force-dynamic";

/**
 * The home page.
 *
 * Rendered on the server from the public API, so it is readable with client
 * JavaScript disabled and understandable to a crawler. Everything below the
 * hero is real content or an honest empty state; nothing is invented to fill
 * the page while the owner has not published anything.
 */
export default async function HomePage() {
  const status = await getStatus();

  if (!status.published) return <UnpublishedHome />;

  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  const featured = projects.filter((project) => project.is_featured).slice(0, 3);
  const shown = featured.length ? featured : projects.slice(0, 3);

  return (
    <div className="shell-width">
      <StructuredData data={personSchema(profile)} />
      <StructuredData data={websiteSchema(profile)} />

      <section className="flex min-h-[calc(100svh-var(--header-height)-6rem)] flex-col justify-center py-20">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
          {profile.headline}
        </p>

        <h1 className="mt-6 max-w-[16ch] text-[length:var(--text-display)] font-medium">
          {profile.full_name}
        </h1>

        <p className="mt-7 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
          {profile.summary}
        </p>

        <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/projects"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-ink px-6 text-[var(--text-small)] font-medium text-ink-inverse transition-transform duration-300 ease-[var(--ease-out)] active:scale-[0.98]"
          >
            Explore the work
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>

          {status.ask_enabled ? (
            <Link
              href="/ask"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] border border-border-strong px-6 font-mono text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              Ask 0xAsk
            </Link>
          ) : null}
        </div>
      </section>

      <Section eyebrow="01" title="Selected work">
        {shown.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {shown.map((project) => (
              <ProjectCardLink key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <EmptyNotice
            title="Nothing published yet"
            body="Projects appear here once they have been through review and published."
          />
        )}

        {projects.length > shown.length ? (
          <div className="mt-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent hover:underline"
            >
              All {projects.length} projects
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : null}
      </Section>

      <Section eyebrow="02" title="Two ways to explore">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-border-subtle sm:grid-cols-2">
          <PathCard
            eyebrow="Classic"
            title="Browse it"
            body="Profile, experience, capabilities, and a full case study for every project. Structured, indexable, readable in a minute."
            href="/projects"
            cta="Selected work"
          />
          <PathCard
            eyebrow="0xAsk"
            title="Ask it"
            body={
              status.ask_available
                ? "Query the same curated knowledge directly. Every answer cites the evidence behind it."
                : "Query the same curated knowledge directly. Not answering yet, and it will say so rather than guess."
            }
            href="/ask"
            cta={status.ask_available ? "Start asking" : "See what it can do"}
          />
        </div>
      </Section>
    </div>
  );
}

function PathCard({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 bg-surface p-7 transition-colors duration-300 hover:bg-surface-raised sm:p-9"
    >
      <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
        {eyebrow}
      </span>
      <span className="text-[length:var(--text-h3)] font-medium">{title}</span>
      <span className="max-w-[42ch] text-ink-muted">{body}</span>
      <span className="mt-3 inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent">
        {cta}
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
        >
          &rarr;
        </span>
      </span>
    </Link>
  );
}

/**
 * What a visitor sees before the owner publishes.
 *
 * Deliberately not an error. The site is complete and simply has nothing to
 * show yet, which is a different thing from being broken.
 */
function UnpublishedHome() {
  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-6rem)] flex-col justify-center py-20">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
        Not yet published
      </p>
      <h1 className="mt-6 max-w-[18ch] text-[length:var(--text-h1)] font-medium">
        This portfolio is not live yet.
      </h1>
      <p className="mt-6 max-w-[52ch] text-ink-muted">
        Nothing is published, so there is nothing to show. That is a deliberate state rather than a
        failure: content becomes visible only after it has been reviewed and approved.
      </p>
    </div>
  );
}
