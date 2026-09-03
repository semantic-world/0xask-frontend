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

  // The headline names several roles in one sentence. Set as a rail of
  // separate titles it reads like a title card rather than a run on line, and
  // it gives the hero a second line of type without a second paragraph.
  const roles = (profile.headline ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

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

      {/* The hero.

          It used to lead with his statement set at display size, a sentence
          long enough to fill a laptop screen on its own, and follow it with
          the whole summary paragraph. Two blocks of prose before anything to
          look at. A portfolio's first screen should introduce a person and
          then get out of the way.

          So the name is the headline, the roles are a rail beneath it, and the
          statement is demoted to one quiet line. The summary is gone from here
          entirely; it is the first thing on the about page, which is where
          somebody who wants it is going. */}
      <section className="relative flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-14 sm:py-20">
        <span
          aria-hidden="true"
          // Sized down on the narrowest screens so the light behind the name
          // cannot reach past the right edge and scroll the page.
          className="pointer-events-none absolute -top-24 left-[-14%] -z-10 size-[15rem] rounded-full bg-accent opacity-[0.12] blur-[110px] sm:-top-40 sm:size-[36rem]"
        />

        <Reveal>
          {/* A status light, not a sentence. His availability names three
              disciplines and ran to three lines inside a pill, which put a
              paragraph above the name before the page had said who he is. The
              sentence itself still closes the page, where there is room to
              read it. */}
          <p className="inline-flex items-center gap-2.5 rounded-full border border-border-subtle bg-surface/60 px-3.5 py-1.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="pulse-dot size-1.5 shrink-0 rounded-full bg-positive"
            />
            Open to work
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-7 max-w-[13ch] text-[length:var(--text-display)] font-medium leading-[0.94] tracking-[-0.045em] sm:mt-9">
            <span className="text-gradient">{profile.full_name}</span>
          </h1>
        </Reveal>

        {roles.length ? (
          <Reveal delay={150}>
            {/* The first title carries the identity and the rest qualify it.
                Set at equal weight they were four tracked out lines under the
                name, which is a table of contents rather than a title card. */}
            <p className="mt-6 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-accent">
              {roles[0]}
            </p>
            {roles.length > 1 ? (
              // Joined as text rather than as separate nodes with separators
              // between them. Each role is long enough to take its own line on
              // a narrow screen, and a separator that leads a wrapped line
              // stops reading as a divider and starts reading as a bullet.
              <p className="mt-2 max-w-[52ch] font-mono text-[var(--text-caption)] text-ink-faint">
                {roles.slice(1).join("  /  ")}
              </p>
            ) : null}
          </Reveal>
        ) : null}

        <Reveal delay={220}>
          <p className="mt-8 max-w-[44ch] text-[length:var(--text-lead)] leading-relaxed text-ink-muted">
            {profile.statement ?? profile.summary}
          </p>
        </Reveal>

        <Reveal delay={290}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        {/* Figures rather than adjectives, and inside the hero rather than in
            a band of their own below it. They are the fastest honest answer to
            "is there anything here", and they were sitting one scroll too far
            down to do that job. */}
        <Reveal delay={360}>
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-border-subtle pt-8 sm:mt-14 sm:grid-cols-4">
            <Figure value={projects.length} label="Projects" />
            <Figure value={skillCount} label="Capabilities" />
            {years ? <Figure value={years} suffix="+" label="Years building" /> : null}
            <Figure value={status.answerable_claims} label="Approved claims" />
          </dl>
        </Reveal>
      </section>

      {technologies.length ? (
        <Reveal as="section" className="border-t border-border-subtle py-8">
          <Marquee items={technologies} label="Technologies used across the published work" />
        </Reveal>
      ) : null}

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

      {/* Capabilities, as a ledger rather than a wall of small boxes.

          Six cards of two lines each read as decoration. The same six set as
          ruled rows, each naming the work behind it, read as a record, which is
          the whole argument this section is making. */}
      {evidenced.length ? (
        <section className="border-t border-border-subtle py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
                  Capabilities
                </p>
                <h2 className="mt-3 max-w-[16ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
                  <span className="text-gradient">Every claim has work behind it</span>
                </h2>
                <p className="mt-4 max-w-[40ch] text-ink-muted">
                  A skill on its own is an assertion. Each of these names the projects that
                  demonstrate it, which is the difference between a list and an argument.
                </p>
                <Link
                  href="/skills"
                  className="group mt-6 inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent"
                >
                  All {skillCount} capabilities
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </Link>
              </div>
            </Reveal>

            <ul className="min-w-0 border-t border-border-subtle">
              {evidenced.map((skill, index) => (
                <Reveal
                  as="li"
                  key={skill.slug}
                  delay={index * 60}
                  className="group border-b border-border-subtle"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 py-5 transition-colors duration-300 group-hover:text-ink">
                    <span
                      aria-hidden="true"
                      className="tabular font-mono text-[var(--text-caption)] text-ink-faint transition-colors duration-300 group-hover:text-accent"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-[length:var(--text-h4)] font-medium tracking-[-0.01em]">
                      {skill.name}
                    </span>
                    <span className="tabular font-mono text-[var(--text-caption)] text-accent">
                      {skill.evidence.length}
                      <span className="text-ink-faint">
                        {skill.evidence.length === 1 ? " project" : " projects"}
                      </span>
                    </span>
                    <span className="w-full min-w-0 truncate text-[var(--text-caption)] text-ink-faint">
                      {skill.evidence
                        .map((entry) => entry.project_name)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(", ")}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {current ? (
        <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface/60 p-7 backdrop-blur-sm sm:p-10 lg:p-12">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 -z-10 size-[15rem] rounded-full bg-accent opacity-[0.09] blur-[80px] sm:size-[22rem]"
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.5fr] lg:gap-14">
              <div className="min-w-0">
                <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
                  {current.is_current ? "Currently" : "Most recently"}
                </p>
                <h2 className="mt-3 max-w-[16ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
                  {current.role}
                </h2>
                {current.organization_name ? (
                  <p className="mt-3 text-[length:var(--text-lead)] text-accent">
                    {current.organization_name}
                  </p>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-5">
                {/* Clamped, with the link underneath. This is a landing page
                    and the role summary runs to a dozen lines; whole role
                    histories stacked on the front page are how a site starts
                    reading as a wall of talk. */}
                {current.summary ? (
                  <p className="line-clamp-4 max-w-[56ch] text-[length:var(--text-lead)] leading-relaxed text-ink-muted">
                    {current.summary}
                  </p>
                ) : null}

                {current.highlights.length ? (
                  <ul className="space-y-2.5">
                    {current.highlights.slice(0, 2).map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-3 text-[var(--text-small)] text-ink-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.7em] size-1 shrink-0 rounded-full bg-accent"
                        />
                        <span className="line-clamp-3 max-w-[56ch]">{highlight}</span>
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
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
        <header className="mb-10">
          <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
            How this works
          </p>
          <h2 className="mt-3 max-w-[22ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
            <span className="text-gradient">Discovery is automatic. Approval is not.</span>
          </h2>
        </header>

        <ol className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-border-subtle sm:grid-cols-3">
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
              className="relative min-w-0 overflow-hidden bg-surface p-7 transition-colors duration-500 hover:bg-surface-raised sm:p-8"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -top-6 select-none font-mono text-[6rem] font-semibold leading-none text-ink opacity-[0.05]"
              >
                {stage.step}
              </span>
              <p className="relative font-mono text-[var(--text-caption)] tracking-[0.16em] text-accent">
                {stage.step}
              </p>
              <h3 className="relative mt-3 text-[length:var(--text-h4)] font-medium tracking-[-0.01em]">
                {stage.title}
              </h3>
              <p className="relative mt-3 text-[var(--text-small)] leading-relaxed text-ink-muted">
                {stage.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </Reveal>

      {/* The two ways in. This is the product's whole idea, so it is given the
          space of a statement rather than the space of a footnote. */}
      <Reveal as="section" className="border-t border-border-subtle py-16 sm:py-20">
        <header className="mb-10">
          <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
            Two ways in
          </p>
          <h2 className="mt-3 max-w-[20ch] text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">
            <span className="text-gradient">Same knowledge, two ways to reach it</span>
          </h2>
        </header>

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

/**
 * One figure from the published record.
 *
 * A definition list rather than paragraphs, because that is what these are:
 * the term is the label and the number is its value. The number leads, since
 * the eye lands on it first and the label only has to say what it counted.
 */
function Figure({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="min-w-0">
      <dd className="tabular text-[length:var(--text-h2)] font-medium leading-none tracking-[-0.045em] text-ink">
        {value}
        {suffix ? <span className="text-accent">{suffix}</span> : null}
      </dd>
      <dt className="mt-2.5 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </dt>
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
      <Link href={href} className="flex h-full flex-col gap-4 p-8 sm:p-10 lg:p-12">
        <span
          className={`font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] ${
            accent ? "text-accent" : "text-ink-faint"
          }`}
        >
          {eyebrow}
        </span>
        <span className="text-[length:var(--text-h2)] font-medium tracking-[-0.03em]">{title}</span>
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
