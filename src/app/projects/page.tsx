import type { Metadata } from "next";
import { EmptyNotice } from "@/components/classic/Section";
import { WorkTabs } from "@/components/classic/WorkTabs";
import { Reveal } from "@/components/motion/Reveal";
import { breadcrumbSchema, projectListSchema, StructuredData } from "@/components/StructuredData";
import { getProjects, NotPublished } from "@/lib/server-api";

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
  alternates: { canonical: "/projects" },
  title: "Work",
  description:
    "Engineering work across AI infrastructure, protocol security, and open source, with a full case study for each project.",
};

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];

  try {
    projects = await getProjects();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  const openSource = projects.filter((project) => project.is_open_source).length;
  const stacks = new Set(projects.flatMap((project) => project.technologies)).size;

  return (
    <div className="shell-width py-14 sm:py-20">
      <StructuredData data={projectListSchema(projects)} />
      <StructuredData
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/projects" },
        ])}
      />

      <header className="mb-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
          Work
        </p>
        <h1 className="mt-6 max-w-[18ch] text-[length:var(--text-h1)] font-medium leading-[1] tracking-[-0.04em]">
          <span className="text-gradient">Things that had to work</span>
        </h1>
        <p className="mt-5 max-w-[60ch] text-[length:var(--text-lead)] text-ink-muted">
          Each of these is written up as a case study rather than a summary: why it exists, how it
          is put together, and the part that was genuinely hard.
        </p>

        {projects.length ? (
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {[
              { value: projects.length, label: "Projects" },
              { value: openSource, label: "Free and open source" },
              { value: stacks, label: "Technologies" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="tabular block text-[length:var(--text-h3)] font-medium tracking-[-0.03em] text-accent">
                    {stat.value}
                  </span>
                  <span className="mt-1 block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {projects.length === 0 ? (
        <EmptyNotice
          title="Nothing published yet"
          body="Projects appear here once they have been reviewed and published."
        />
      ) : (
        <Reveal>
          <WorkTabs projects={projects} />
        </Reveal>
      )}
    </div>
  );
}
