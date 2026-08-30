import type { Metadata } from "next";
import { Prose, Section } from "@/components/classic/Section";
import { getProfile, NotPublished } from "@/lib/server-api";

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
  title: "About",
  description: "Who 0xSemantic is and how they work.",
};

export default async function AboutPage() {
  try {
    const profile = await getProfile();

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
