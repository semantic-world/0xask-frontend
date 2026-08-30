import type { Metadata } from "next";
import Link from "next/link";
import { EmptyNotice } from "@/components/classic/Section";
import { getResume, NotPublished, type Resume } from "@/lib/server-api";

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
  title: "Resume",
  description: "The same work, ordered for the role you are hiring for.",
};

const VARIANTS = [
  { key: "general", label: "General" },
  { key: "ai-engineer", label: "AI engineer" },
  { key: "backend-engineer", label: "Backend engineer" },
  { key: "protocol-engineer", label: "Protocol engineer" },
  { key: "security-engineer", label: "Security engineer" },
];

type Search = { searchParams: Promise<{ role?: string }> };

/**
 * The resume, rendered for a role.
 *
 * The variant is a query parameter rather than a route, so switching is a
 * plain link that works without client JavaScript and the printed page keeps
 * whichever one the reader chose.
 */
export default async function ResumePage({ searchParams }: Search) {
  const { role } = await searchParams;
  const variant = VARIANTS.some((item) => item.key === role) ? (role as string) : "general";

  let resume: Resume | null = null;
  try {
    resume = await getResume(variant);
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  if (!resume) {
    return (
      <div className="shell-width py-14 sm:py-20">
        <EmptyNotice
          title="Nothing published yet"
          body="The resume is generated from published work, and there is none yet."
        />
      </div>
    );
  }

  return (
    <div className="shell-width py-14 sm:py-20">
      <nav aria-label="Resume variant" className="mb-10 print:hidden">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
          Ordered for
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {VARIANTS.map((item) => (
            <li key={item.key}>
              <Link
                href={item.key === "general" ? "/resume" : `/resume?role=${item.key}`}
                aria-current={item.key === variant ? "page" : undefined}
                className={`inline-block rounded-full border px-3.5 py-1.5 text-[var(--text-caption)] transition-colors duration-200 ${
                  item.key === variant
                    ? "border-accent bg-accent-wash text-ink"
                    : "border-border-subtle text-ink-faint hover:border-border-strong hover:text-ink-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[56ch] text-[var(--text-caption)] text-ink-faint">
          The facts are identical in every version. Only the order changes, so what matters for the
          role you are hiring for appears first.
        </p>
      </nav>

      <article className="mx-auto max-w-[52rem]">
        <header className="border-b border-border-subtle pb-8">
          <h1 className="text-[length:var(--text-h1)] font-medium">{resume.profile.full_name}</h1>
          <p className="mt-3 text-[length:var(--text-lead)] text-ink-muted">{resume.headline}</p>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[var(--text-caption)] text-ink-faint">
            {resume.profile.location ? <li>{resume.profile.location}</li> : null}
            {resume.profile.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  rel="noopener noreferrer me"
                  className="text-accent hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <ResumeSection title="Summary">
          <p className="max-w-[68ch] text-ink-muted">{resume.summary}</p>
        </ResumeSection>

        {resume.experience.length ? (
          <ResumeSection title="Experience">
            <ol className="space-y-7">
              {resume.experience.map((entry) => (
                <li key={`${entry.role}-${entry.started_on}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[length:var(--text-h4)] font-medium">
                      {entry.role}
                      {entry.organization_name ? (
                        <span className="text-accent"> · {entry.organization_name}</span>
                      ) : null}
                    </h3>
                    <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
                      {new Date(entry.started_on).getFullYear()} to{" "}
                      {entry.is_current
                        ? "present"
                        : entry.ended_on
                          ? new Date(entry.ended_on).getFullYear()
                          : "present"}
                    </span>
                  </div>
                  {entry.summary ? (
                    <p className="mt-2 max-w-[68ch] text-[var(--text-small)] text-ink-muted">
                      {entry.summary}
                    </p>
                  ) : null}
                  {entry.highlights.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {entry.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex gap-2.5 text-[var(--text-small)] text-ink-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1 shrink-0 rounded-full bg-accent"
                          />
                          <span className="max-w-[64ch]">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </ResumeSection>
        ) : null}

        {resume.projects.length ? (
          <ResumeSection title="Selected work">
            <ul className="space-y-5">
              {resume.projects.slice(0, 6).map((project) => (
                <li key={project.slug}>
                  <h3 className="text-[length:var(--text-h4)] font-medium">
                    <Link href={`/projects/${project.slug}`} className="hover:text-accent">
                      {project.name}
                    </Link>
                  </h3>
                  {project.tagline || project.summary ? (
                    <p className="mt-1 max-w-[68ch] text-[var(--text-small)] text-ink-muted">
                      {project.tagline ?? project.summary}
                    </p>
                  ) : null}
                  {project.technologies.length ? (
                    <p className="mt-1 font-mono text-[var(--text-caption)] text-ink-faint">
                      {project.technologies.join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </ResumeSection>
        ) : null}

        {resume.skills.length ? (
          <ResumeSection title="Capabilities">
            <dl className="space-y-3">
              {resume.skills.map((group) => (
                <div key={group.category} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                  <dt className="font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-faint">
                    {group.category.toLowerCase()}
                  </dt>
                  <dd className="text-[var(--text-small)] text-ink-muted">
                    {group.skills.map((skill) => skill.name).join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </ResumeSection>
        ) : null}
      </article>
    </div>
  );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-subtle py-8 last:border-0">
      <h2 className="mb-5 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}
