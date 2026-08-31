import type { Metadata } from "next";
import Link from "next/link";
import { EmptyNotice, Prose, TagList } from "@/components/classic/Section";
import { type Experience, getExperience, NotPublished } from "@/lib/server-api";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors, which is the opposite of what the invalidation is for.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/experience" },
  title: "Experience",
  description: "Roles and engagements from 2021 onward, and the work each one produced.",
};

const KIND_LABEL: Record<string, string> = {
  EMPLOYMENT: "Employment",
  CONTRACT: "Contract",
  FOUNDING: "Founding",
  FREELANCE: "Freelance",
  OPEN_SOURCE: "Open source",
  RESEARCH: "Research",
};

export default async function ExperiencePage() {
  let entries: Experience[] = [];

  try {
    entries = await getExperience();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  return (
    <div className="shell-width py-14 sm:py-20">
      <header className="mb-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
          Experience
        </p>
        <h1 className="mt-6 max-w-[18ch] text-[length:var(--text-h1)] font-medium leading-[1] tracking-[-0.04em]">
          <span className="text-gradient">Where the work happened</span>
        </h1>
        <p className="mt-5 max-w-[60ch] text-[length:var(--text-lead)] text-ink-muted">
          Five tracks running in parallel rather than one after another: the enterprise AI work, the
          protocol research, the open source, the evaluation practice, and the client engagements
          that have been going since 2021.
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyNotice
          title="Nothing published yet"
          body="Roles appear here once they have been reviewed and approved."
        />
      ) : (
        <ol className="space-y-0">
          {entries.map((entry) => (
            <li
              key={`${entry.role}-${entry.started_on}`}
              className="border-t border-border-subtle py-10 first:border-t-0 first:pt-0"
            >
              <div className="grid gap-5 lg:grid-cols-[12rem_1fr]">
                <div>
                  <p className="tabular font-mono text-[var(--text-caption)] tracking-[0.08em] text-ink-faint">
                    {formatRange(entry)}
                  </p>
                  <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
                    {KIND_LABEL[entry.kind] ?? entry.kind}
                  </p>
                </div>

                <div>
                  <h2 className="text-[length:var(--text-h4)] font-medium">{entry.role}</h2>
                  {entry.organization_name ? (
                    <p className="mt-1 text-[var(--text-small)] text-accent">
                      {entry.organization_name}
                      {entry.location ? (
                        <span className="text-ink-faint"> · {entry.location}</span>
                      ) : null}
                    </p>
                  ) : null}

                  {entry.summary ? (
                    <div className="mt-4">
                      <Prose text={entry.summary} />
                    </div>
                  ) : null}

                  {entry.highlights.length ? (
                    <ul className="mt-4 space-y-2">
                      {entry.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex gap-3 text-[var(--text-small)] text-ink-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1 shrink-0 rounded-full bg-accent"
                          />
                          <span className="max-w-[62ch]">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {entry.projects.length ? (
                    <div className="mt-6">
                      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
                        What came out of it
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {entry.projects.map((project) => (
                          <li key={project.slug}>
                            <Link
                              href={`/projects/${project.slug}`}
                              title={project.tagline ?? undefined}
                              className="group inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/70 py-1.5 pl-3.5 pr-3 text-[var(--text-small)] backdrop-blur-sm transition-[border-color,color,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                            >
                              {project.name}
                              <span
                                aria-hidden="true"
                                className="text-ink-faint transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-accent"
                              >
                                &rarr;
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {entry.technologies.length ? (
                    <div className="mt-6">
                      <TagList items={entry.technologies} label="Technologies" />
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatRange(entry: Experience): string {
  const start = new Date(entry.started_on).getFullYear();
  if (entry.is_current) return `${start} to present`;
  if (!entry.ended_on) return `${start}`;
  const end = new Date(entry.ended_on).getFullYear();
  return start === end ? `${start}` : `${start} to ${end}`;
}
