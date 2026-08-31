import Link from "next/link";
import { ProjectCardLink } from "@/components/classic/ProjectCard";
import { EmptyNotice } from "@/components/classic/Section";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { personSchema, StructuredData, websiteSchema } from "@/components/StructuredData";
import { getProfile, getProjects, getSkills, getStatus } from "@/lib/server-api";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await getStatus();

  if (!status.published) return <UnpublishedHome />;

  const [profile, projects, skillGroups] = await Promise.all([
    getProfile(),
    getProjects(),
    getSkills().catch(() => []),
  ]);

  const featured = projects.filter((project) => project.is_featured);
  const shown = (featured.length ? featured : projects).slice(0, 3);

  // Technologies the published work actually names, most common first. A
  // marquee of aspirations would be a different thing entirely.
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const technology of project.technologies) {
      counts.set(technology, (counts.get(technology) ?? 0) + 1);
    }
  }
  const technologies = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 18);

  const skillCount = skillGroups.reduce((sum, group) => sum + group.skills.length, 0);

  return (
    <div className="shell-width">
      <StructuredData data={personSchema(profile)} />
      <StructuredData data={websiteSchema(profile)} />

      <section className="flex min-h-[calc(100svh-var(--header-height)-5rem)] flex-col justify-center py-16 sm:py-20">
        <Reveal>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-border-subtle bg-surface/60 px-3.5 py-1.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
            <span aria-hidden="true" className="pulse-dot size-1.5 rounded-full bg-positive" />
            {profile.availability ?? "Open to engineering work"}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-8 max-w-[15ch] text-[length:var(--text-display)] font-medium leading-[0.95] tracking-[-0.04em]">
            <span className="text-gradient">Systems built to be understood</span>
            <span className="text-ink-faint">.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-8 max-w-[54ch] text-[length:var(--text-lead)] leading-relaxed text-ink-muted">
            {profile.summary}
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/projects"
              className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[var(--text-small)] font-medium text-ink-inverse shadow-[var(--shadow-lift-2)] transition-all duration-300 ease-[var(--ease-out)] hover:shadow-[var(--shadow-lift-3)] active:scale-[0.98]"
            >
              Explore the work
              <span
                aria-hidden="true"
                className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>

            {status.ask_enabled ? (
              <Link
                href="/ask"
                className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-border-strong px-7 py-3.5 font-mono text-[var(--text-small)] font-medium transition-all duration-300 hover:border-accent hover:text-accent hover:shadow-[var(--shadow-glow)] active:scale-[0.98]"
              >
                <span aria-hidden="true" className="text-accent">
                  0x
                </span>
                Ask anything
              </Link>
            ) : null}
          </div>
        </Reveal>

        {technologies.length ? (
          <Reveal delay={340} className="mt-16">
            <Marquee items={technologies} label="Technologies used across the published work" />
          </Reveal>
        ) : null}
      </section>

      <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <Stat value={projects.length} label="Published projects" />
          <Stat value={skillCount} label="Capabilities, each with evidence" />
          <Stat value={status.answerable_claims} label="Approved claims 0xAsk can answer from" />
        </div>
      </Reveal>

      <section className="border-t border-border-subtle py-16 sm:py-20">
        <Reveal>
          <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
                Selected work
              </p>
              <h2 className="mt-3 max-w-[22ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
                A handful worth reading about
              </h2>
            </div>
            {projects.length > shown.length ? (
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent"
              >
                All {projects.length}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            ) : null}
          </header>
        </Reveal>

        {shown.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {shown.map((project, index) => (
              <Reveal key={project.slug} delay={index * 90}>
                <ProjectCardLink project={project} index={index} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyNotice
            title="Nothing published yet"
            body="Projects appear here once they have been through review and published."
          />
        )}
      </section>

      <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-border-subtle sm:grid-cols-2">
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
                ? "Query the same curated knowledge directly. Every answer cites the evidence behind it, and says so when the evidence is not there."
                : "Query the same curated knowledge directly. Not answering yet, and it will say so rather than guess."
            }
            href="/ask"
            cta={status.ask_available ? "Start asking" : "See what it does"}
            accent
          />
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="tabular text-[length:var(--text-h1)] font-medium leading-none tracking-[-0.04em] text-ink">
        {value}
      </p>
      <p className="mt-3 max-w-[24ch] text-[var(--text-small)] text-ink-muted">{label}</p>
    </div>
  );
}

function PathCard({
  eyebrow,
  title,
  body,
  href,
  cta,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  accent?: boolean;
}) {
  return (
    <Spotlight className="group bg-surface transition-colors duration-500 hover:bg-surface-raised">
      <Link href={href} className="flex h-full flex-col gap-3.5 p-8 sm:p-10">
        <span
          className={`font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] ${
            accent ? "text-accent" : "text-ink-faint"
          }`}
        >
          {eyebrow}
        </span>
        <span className="text-[length:var(--text-h3)] font-medium tracking-[-0.02em]">{title}</span>
        <span className="max-w-[40ch] text-ink-muted">{body}</span>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[var(--text-small)] font-medium text-accent">
          {cta}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1.5"
          >
            &rarr;
          </span>
        </span>
      </Link>
    </Spotlight>
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
      <p className="inline-flex w-fit items-center gap-2.5 rounded-full border border-border-subtle bg-surface/60 px-3.5 py-1.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-faint backdrop-blur-sm">
        <span aria-hidden="true" className="pulse-dot size-1.5 rounded-full bg-caution" />
        Not yet published
      </p>
      <h1 className="mt-8 max-w-[18ch] text-[length:var(--text-h1)] font-medium tracking-[-0.03em]">
        <span className="text-gradient">This portfolio is not live yet.</span>
      </h1>
      <p className="mt-7 max-w-[52ch] text-[length:var(--text-lead)] text-ink-muted">
        Nothing is published, so there is nothing to show. That is a deliberate state rather than a
        failure: content becomes visible only after it has been reviewed and approved.
      </p>
    </div>
  );
}
