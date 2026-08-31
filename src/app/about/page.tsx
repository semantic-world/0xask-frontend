import type { Metadata } from "next";
import { Prose, Section } from "@/components/classic/Section";
import { getCredentials, getProfile, NotPublished } from "@/lib/server-api";

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
  alternates: { canonical: "/about" },
  title: "About",
  description: "Who 0xSemantic is and how they work.",
};

export default async function AboutPage() {
  try {
    const [profile, credentials] = await Promise.all([
      getProfile(),
      getCredentials().catch(() => ({ education: [], certifications: [] })),
    ]);

    return (
      <div className="shell-width py-14 sm:py-20">
        <header className="mb-4">
          <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
            About
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[length:var(--text-h1)] font-medium">
            {profile.full_name}
          </h1>
          <p className="mt-5 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
            {profile.headline}
          </p>
        </header>

        <Section bordered={false}>
          <Prose text={profile.bio ?? profile.summary} />
        </Section>

        <Section eyebrow="01" title="Where to find the work">
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.location ? <Fact label="Based" value={profile.location} /> : null}
            {profile.availability ? (
              <Fact label="Availability" value={profile.availability} />
            ) : null}
            {profile.handle ? <Fact label="Handle" value={profile.handle} /> : null}
          </dl>

          {profile.links.length ? (
            <ul className="mt-9 flex flex-wrap gap-3">
              {profile.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border-strong px-4 py-2 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
                  >
                    {link.label}
                    <span aria-hidden="true">&#8599;</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        {credentials.education.length ? (
          <Section eyebrow="02" title="Education">
            <ul className="space-y-6">
              {credentials.education.map((entry) => (
                <li key={`${entry.institution}-${entry.qualification}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[length:var(--text-h4)] font-medium">
                      {entry.qualification}
                      {entry.field_of_study ? (
                        <span className="text-accent">, {entry.field_of_study}</span>
                      ) : null}
                    </h3>
                    {entry.completed_on ? (
                      <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
                        {new Date(entry.completed_on).getFullYear()}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[var(--text-small)] text-ink-muted">
                    {entry.institution}
                  </p>
                  {entry.result ? (
                    <p className="mt-1 text-[var(--text-caption)] text-ink-faint">{entry.result}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {credentials.certifications.length ? (
          <Section eyebrow="03" title="Certifications">
            <ul className="grid gap-3 sm:grid-cols-2">
              {credentials.certifications.map((entry) => (
                <li
                  key={entry.name}
                  className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface/60 p-5 backdrop-blur-sm"
                >
                  <p className="font-medium">{entry.name}</p>
                  <p className="mt-1 text-[var(--text-caption)] text-ink-faint">
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
          </Section>
        ) : null}
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
      <dt className="font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-ink-faint">
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
