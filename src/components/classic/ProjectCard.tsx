import Link from "next/link";
import { Spotlight } from "@/components/motion/Spotlight";
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

/**
 * A project, as a card.
 *
 * The index is set in large type behind the content rather than beside it. It
 * gives the card a focal point that is not the heading, which is what makes a
 * grid of them scan as a set rather than a list.
 */
export function ProjectCardLink({ project, index }: { project: Project; index?: number }) {
  return (
    <Spotlight
      as="article"
      className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface/70 backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-lift-3)]"
    >
      {/* A wash that arrives with the pointer, so the card lights from within
          rather than simply changing colour. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-wash via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {index !== undefined ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-6 select-none font-mono text-[7rem] font-semibold leading-none text-ink opacity-[0.045] transition-opacity duration-500 group-hover:opacity-[0.09]"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}

      <Link
        href={`/projects/${project.slug}`}
        className="relative flex flex-col gap-3.5 p-7 sm:p-8"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
            {categoryLabel(project.category)}
          </span>
          {project.is_featured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-accent">
              <span aria-hidden="true" className="pulse-dot size-1 rounded-full bg-accent" />
              Selected
            </span>
          ) : null}
          {/* Whether something is free and open source is a reason to click, so
              it belongs on the card rather than three screens into the page. */}
          {project.is_open_source ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-sunken px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted">
              <span aria-hidden="true">&#9670;</span>
              {project.license ?? "Open source"}
            </span>
          ) : null}
        </div>

        <h3 className="text-[length:var(--text-h3)] font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent">
          {project.name}
        </h3>

        {project.tagline || project.summary ? (
          <p className="max-w-[44ch] text-ink-muted">{project.tagline ?? project.summary}</p>
        ) : null}

        {project.technologies.length ? (
          <ul aria-label="Technologies" className="mt-1 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((technology) => (
              <li
                key={technology}
                className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint"
              >
                {technology}
              </li>
            ))}
          </ul>
        ) : null}

        <span className="mt-3 inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent">
          Read the case study
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
