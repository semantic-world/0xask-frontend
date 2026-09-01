import type { Metadata } from "next";
import Link from "next/link";
import { Prose, Section } from "@/components/classic/Section";
import { Reveal } from "@/components/motion/Reveal";
import {
  breadcrumbSchema,
  expertiseSchema,
  profilePageSchema,
  StructuredData,
} from "@/components/StructuredData";
import {
  getCredentials,
  getExperience,
  getProfile,
  getSkills,
  NotPublished,
} from "@/lib/server-api";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors, which is the opposite of what the invalidation is for.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // Named from the record, so it stays whatever he says it is.
  let name = "";
  let headline = "";

  try {
    const profile = await getProfile();
    name = profile.full_name;
    headline = profile.headline;
  } catch {
    // Unpublished or unreachable. A generic title is still a correct one.
  }

  return {
    alternates: { canonical: "/about" },
    // Deliberately the name rather than the word "About". This is the page a
    // search for the person should land on, and a title of "About" tells a
    // search engine nothing about whom.
    // Absolute, because the layout template appends the name to every title
    // and this one already is the name. Without it the tab reads it twice.
    title: { absolute: name ? `${name}, about` : "About" },
    description: name
      ? `${name}${headline ? `, ${headline}` : ""}. Background, education, certifications, and how to reach him.`
      : "Background, education, certifications, and how to get in touch.",
  };
}

export default async function AboutPage() {
  try {
    // Each of these already fails soft, because a missing section should cost
    // that section and not the page.
    const [profile, credentials, skills, experience] = await Promise.all([
      getProfile(),
      getCredentials().catch(() => ({ education: [], certifications: [] })),
      getSkills().catch(() => []),
      getExperience().catch(() => []),
    ]);

    const featured = skills.flatMap((group) => group.skills.filter((skill) => skill.is_featured));
    const earliest = experience.reduce<number | null>((oldest, entry) => {
      const year = new Date(entry.started_on).getFullYear();
      return oldest === null || year < oldest ? year : oldest;
    }, null);

    return (
      <div className="shell-width py-14 sm:py-20">
        <StructuredData data={profilePageSchema(profile)} />
        <StructuredData data={expertiseSchema(profile, featured)} />
        <StructuredData
          data={breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ])}
        />

        <header className="mb-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
            About
          </p>
          <h1 className="mt-6 max-w-[16ch] text-[length:var(--text-h1)] font-medium leading-[1] tracking-[-0.04em]">
            <span className="text-gradient">{profile.full_name}</span>
          </h1>
          <p className="mt-5 max-w-[56ch] text-[length:var(--text-lead)] text-ink-muted">
            {profile.headline}
          </p>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-border-subtle pt-8">
            {profile.location ? <Fact label="Based" value={profile.location} /> : null}
            {profile.handle ? <Fact label="Handle" value={profile.handle} /> : null}
            {earliest ? <Fact label="Building since" value={String(earliest)} /> : null}
          </dl>
        </header>

        <Reveal>
          <div className="max-w-[68ch] text-[length:var(--text-body)] leading-[1.75]">
            <Prose text={profile.bio ?? profile.summary} />
          </div>
        </Reveal>

        {featured.length ? (
          <Reveal>
            <Section eyebrow="01" title="What he works on">
              <p className="mb-7 max-w-[58ch] text-ink-muted">
                Each of these is tied to the work that demonstrates it rather than asserted on its
                own.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {featured.map((skill) => (
                  <li
                    key={skill.slug}
                    className="group rounded-[var(--radius-lg)] border border-border-subtle bg-surface/60 p-5 backdrop-blur-sm transition-[border-color,transform] duration-500 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong"
                  >
                    <p className="font-medium">{skill.name}</p>
                    {skill.summary ? (
                      <p className="mt-1.5 text-[var(--text-small)] text-ink-muted">
                        {skill.summary}
                      </p>
                    ) : null}
                    {skill.evidence.length ? (
                      <ul className="mt-3.5 flex flex-wrap gap-1.5">
                        {/* Evidence can point at an experience or a source
                            rather than a project, and only a project has a page
                            to link to. */}
                        {skill.evidence
                          .filter((evidence) => evidence.project_slug && evidence.project_name)
                          .slice(0, 3)
                          .map((evidence) => (
                            <li key={evidence.project_slug}>
                              <Link
                                href={`/projects/${evidence.project_slug}`}
                                className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint transition-colors duration-300 hover:text-accent"
                              >
                                {evidence.project_name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="mt-7">
                <Link
                  href="/skills"
                  className="group inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent"
                >
                  Every skill, with its evidence
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1.5"
                  >
                    &rarr;
                  </span>
                </Link>
              </p>
            </Section>
          </Reveal>
        ) : null}

        {credentials.education.length || credentials.certifications.length ? (
          <Reveal>
            <Section eyebrow="02" title="Education and certification">
              <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                {credentials.education.length ? (
                  <div>
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
                      Education
                    </p>
                    <ul className="mt-4 space-y-6">
                      {credentials.education.map((entry) => (
                        <li key={`${entry.institution}-${entry.qualification}`}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-[length:var(--text-h4)] font-medium">
                              {entry.qualification}
                            </h3>
                            {entry.completed_on ? (
                              <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
                                {new Date(entry.completed_on).getFullYear()}
                              </span>
                            ) : null}
                          </div>
                          {entry.field_of_study ? (
                            <p className="mt-1 text-[var(--text-small)] text-accent">
                              {entry.field_of_study}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[var(--text-small)] text-ink-muted">
                            {entry.institution}
                          </p>
                          {entry.result ? (
                            <p className="mt-1 text-[var(--text-caption)] text-ink-faint">
                              {entry.result}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {credentials.certifications.length ? (
                  <div>
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
                      Certifications
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {credentials.certifications.map((entry) => (
                        <li
                          key={entry.name}
                          className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface/60 p-5 backdrop-blur-sm transition-[border-color] duration-500 hover:border-border-strong"
                        >
                          <p className="text-[var(--text-small)] font-medium leading-snug">
                            {entry.name}
                          </p>
                          <p className="mt-1.5 text-[var(--text-caption)] text-ink-faint">
                            {entry.issuer}
                            {entry.issued_on ? ` · ${new Date(entry.issued_on).getFullYear()}` : ""}
                          </p>
                          {entry.topics.length ? (
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                              {entry.topics.map((topic) => (
                                <li
                                  key={topic}
                                  className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint"
                                >
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Section>
          </Reveal>
        ) : null}

        <Reveal>
          <Section eyebrow="03" title="Where to find him">
            {profile.availability ? (
              <p className="mb-7 max-w-[56ch] text-ink-muted">{profile.availability}.</p>
            ) : null}

            {profile.links.length ? (
              <ul className="flex flex-wrap gap-3">
                {profile.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      rel="noopener noreferrer me"
                      target="_blank"
                      className="group inline-flex items-center gap-2 rounded-[var(--radius)] border border-border-strong px-4 py-2.5 text-[var(--text-small)] font-medium transition-[border-color,color,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className="text-ink-faint transition-[transform,color] duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:text-accent"
                      >
                        &#8599;
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>
        </Reveal>
      </div>
    );
  } catch (error) {
    if (error instanceof NotPublished) return <Unpublished />;
    throw error;
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-2 text-[var(--text-small)]">{value}</dd>
    </div>
  );
}

function Unpublished() {
  return (
    <div className="shell-width py-24">
      <h1 className="text-[length:var(--text-h2)] font-medium">Not published yet</h1>
      <p className="mt-4 max-w-[52ch] text-ink-muted">
        There is nothing here yet. Content becomes visible only after it has been reviewed and
        approved.
      </p>
    </div>
  );
}
