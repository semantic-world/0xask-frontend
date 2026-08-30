import type { Metadata } from "next";
import { categoryLabel, ProjectCardLink } from "@/components/classic/ProjectCard";
import { EmptyNotice } from "@/components/classic/Section";
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
  description: "Selected engineering work, with a full case study for each project.",
};

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];

  try {
    projects = await getProjects();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  const grouped: Record<string, typeof projects> = {};
  for (const project of projects) {
    const bucket = grouped[project.category];
    if (bucket) {
      bucket.push(project);
    } else {
      grouped[project.category] = [project];
    }
  }

  return (
    <div className="shell-width py-14 sm:py-20">
      <header className="mb-12">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
          Work
        </p>
        <h1 className="mt-4 max-w-[20ch] text-[length:var(--text-h1)] font-medium">
          Selected engineering work
        </h1>
        <p className="mt-5 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
          A handful of projects worth reading about, each with the reasoning behind it rather than a
          list of technologies.
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyNotice
          title="Nothing published yet"
          body="Projects appear here once they have been reviewed and published."
        />
      ) : (
        <div className="space-y-14">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-5 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
                {categoryLabel(category)}
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((project) => (
                  <ProjectCardLink key={project.slug} project={project} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
