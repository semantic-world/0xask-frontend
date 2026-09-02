import Link from "next/link";
import { ProjectCardLink } from "@/components/classic/ProjectCard";
import { EmptyNotice } from "@/components/classic/Section";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { personSchema, StructuredData, websiteSchema } from "@/components/StructuredData";
import { getExperience, getProfile, getProjects, getSkills, getStatus } from "@/lib/server-api";

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

  const [profile, projects, skillGroups, experience] = await Promise.all([
    getProfile(),
    getProjects(),
    getSkills().catch(() => []),
    getExperience().catch(() => []),
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

  // Capabilities with something published behind them, which is the only kind
  // worth putting on a landing page.
  const evidenced = skillGroups
    .flatMap((group) => group.skills.map((skill) => ({ ...skill, group: group.category })))
    .filter((skill) => skill.evidence.length > 0)
    .sort((a, b) => b.evidence.length - a.evidence.length)
    .slice(0, 6);

  const current = experience.find((entry) => entry.is_current) ?? experience[0];

  const earliest = experience.reduce<string | null>(
    (oldest, entry) => (!oldest || entry.started_on < oldest ? entry.started_on : oldest),
    null,
  );
  const years = earliest
    ? Math.max(1, new Date().getFullYear() - new Date(earliest).getFullYear())
    : null;

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
          {/* His own line, from the profile, rather than one written into the
              site. The most prominent sentence on a portfolio should be the
              owner's, and it carries the accent sweep.

              The name stays a caption underneath. It was moved into the
              heading to help a search for the person, and the heading is
              capped at 17ch for the display type, which is the wrong measure
              for a line of tracked out monospace: it wrapped and threw the
              hero out. The name reaches search through the title, the
              description, and the Person schema instead, which is where a
              crawler actually reads it. */}
          <h1 className="mt-8 max-w-[20ch] text-[length:var(--text-display)] font-medium leading-[1.02] tracking-[-0.035em]">
            <span className="text-gradient">{profile.statement ?? profile.headline}</span>
          </h1>

          <p className="mt-6 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
            {profile.full_name}
          </p>
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value={projects.length} label="Published projects" />
          <Stat value={skillCount} label="Capabilities, each with evidence" />
          {years ? <Stat value={years} suffix="+" label="Years building systems" /> : null}
          <Stat value={status.answerable_claims} label="Approved claims 0xAsk answers from" />
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

      {evidenced.length ? (
        <section className="border-t border-border-subtle py-16 sm:py-20">
          <Reveal>
            <header className="mb-10">
              <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
                Capabilities
              </p>
              <h2 className="mt-3 max-w-[24ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
                Every claim has work behind it
              </h2>
              <p className="mt-4 max-w-[54ch] text-ink-muted">
                A skill on its own is an assertion. Each of these links to the projects that
                demonstrate it, which is the difference between a list and an argument.
              </p>
            </header>
          </Reveal>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {evidenced.map((skill, index) => (
              <Reveal as="li" key={skill.slug} delay={index * 60}>
                <Spotlight className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface/70 p-5 backdrop-blur-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift-2)]">
                  <p className="text-[length:var(--text-h4)] font-medium">{skill.name}</p>
                  <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[var(--text-caption)] text-ink-faint">
                    <span className="text-accent">
                      {skill.evidence.length} {skill.evidence.length === 1 ? "project" : "projects"}
                    </span>
                    {skill.evidence
                      .map((entry) => entry.project_name)
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                  </p>
                </Spotlight>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={220} className="mt-8">
            <Link
              href="/skills"
              className="group inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent"
            >
              All {skillCount} capabilities
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
          </Reveal>
        </section>
      ) : null}

      {current ? (
        <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
                {current.is_current ? "Currently" : "Most recently"}
              </p>
              <h2 className="mt-3 max-w-[18ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
                {current.role}
              </h2>
              {current.organization_name ? (
                <p className="mt-3 text-[length:var(--text-lead)] text-accent">
                  {current.organization_name}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col justify-center gap-5">
              {current.summary ? (
                <p className="max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
                  {current.summary}
                </p>
              ) : null}

              {current.highlights.length ? (
                <ul className="space-y-2.5">
                  {current.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="mt-[0.6em] size-1 shrink-0 rounded-full bg-accent"
                      />
                      <span className="max-w-[58ch]">{highlight}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Link
                href="/experience"
                className="group inline-flex w-fit items-center gap-2 text-[var(--text-small)] font-medium text-accent"
              >
                The full history
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
        <header className="mb-10">
          <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
            How this works
          </p>
          <h2 className="mt-3 max-w-[26ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
            Discovery is automatic. Approval is not.
          </h2>
        </header>

        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Discovered",
              body: "Repositories are read on a schedule, credentials stripped before anything is stored, and turned into individual claims with their source attached.",
            },
            {
              step: "02",
              title: "Reviewed",
              body: "Nothing reaches this site until a person decides it should. The system suggests how far a claim may travel; it never decides.",
            },
            {
              step: "03",
              title: "Answerable",
              body: "Approved claims become the only thing 0xAsk can draw on. Ask it something outside them and it says so rather than guessing.",
            },
          ].map((stage, index) => (
            <Reveal
              as="li"
              key={stage.step}
              delay={index * 90}
              className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface/60 p-6 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-4 select-none font-mono text-[4.5rem] font-semibold leading-none text-ink opacity-[0.05]"
              >
                {stage.step}
              </span>
              <p className="relative font-mono text-[var(--text-caption)] tracking-[0.16em] text-accent">
                {stage.step}
              </p>
              <h3 className="relative mt-2 text-[length:var(--text-h4)] font-medium">
                {stage.title}
              </h3>
              <p className="relative mt-3 text-[var(--text-small)] text-ink-muted">{stage.body}</p>
            </Reveal>
          ))}
        </ol>
      </Reveal>

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

      <Reveal as="section" className="border-t border-border-subtle py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface/60 px-8 py-14 text-center backdrop-blur-sm sm:px-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-accent opacity-[0.08] blur-[100px]"
          />

          <h2 className="relative mx-auto max-w-[20ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
            <span className="text-gradient">Worth a conversation?</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-[46ch] text-ink-muted">
            {profile.availability ??
              "Open to conversations about engineering work across AI, backend, protocol, and security."}
          </p>

          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[var(--text-small)] font-medium text-ink-inverse shadow-[var(--shadow-lift-2)] transition-all duration-300 hover:shadow-[var(--shadow-lift-3)] active:scale-[0.98]"
            >
              Get in touch
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2.5 rounded-full border border-border-strong px-7 py-3.5 text-[var(--text-small)] font-medium transition-all duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              Read the resume
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div>
      <p className="tabular text-[length:var(--text-h1)] font-medium leading-none tracking-[-0.04em] text-ink">
        {value}
        {suffix ? <span className="text-accent">{suffix}</span> : null}
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
