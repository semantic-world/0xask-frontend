import Link from "next/link";
import { TagList } from "@/components/classic/Section";
import type { ProjectCard as Project } from "@/lib/server-api";

const CATEGORY_LABEL: Record<string, string> = {
  AI_INFRASTRUCTURE: "AI infrastructure",
  BACKEND: "Backend",
  PROTOCOL: "Protocol",
  SECURITY: "Security",
  DEVELOPER_TOOLING: "Developer tooling",
  DATA: "Data",
  APPLICATION: "Application",
  RESEARCH: "Research",
  OTHER: "Other",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category.replace(/_/g, " ").toLowerCase();
}

export function ProjectCardLink({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-6 transition-all duration-300 ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-raised sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
          {categoryLabel(project.category)}
        </span>
        {project.is_featured ? (
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-accent">
            Selected
          </span>
        ) : null}
      </div>

      <h3 className="text-[length:var(--text-h3)] font-medium">{project.name}</h3>

      {project.tagline ? (
        <p className="max-w-[46ch] text-ink-muted">{project.tagline}</p>
      ) : project.summary ? (
        <p className="max-w-[46ch] text-ink-muted">{project.summary}</p>
      ) : null}

      {project.technologies.length ? (
        <div className="mt-2">
          <TagList items={project.technologies.slice(0, 5)} label="Technologies" />
        </div>
      ) : null}

      <span className="mt-3 inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent">
        Read the case study
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
        >
          &rarr;
        </span>
      </span>
    </Link>
  );
}
