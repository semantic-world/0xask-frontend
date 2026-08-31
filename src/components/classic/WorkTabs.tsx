"use client";

import { useId, useMemo, useState } from "react";
import { ProjectCardLink } from "@/components/classic/ProjectCard";
import type { ProjectCard as Project } from "@/lib/server-api";

/**
 * The work, filtered by what a visitor came to see.
 *
 * Grouping by category alone made the page a long scroll through nine
 * headings, where the thing someone actually wanted was three screens down.
 * These tabs cut across the categories instead: what shipped, what is open,
 * what is research. A project appears under every tab it belongs to, because
 * they are lenses on one set rather than a partition of it.
 *
 * Filtering happens on an array that is already in memory. There is no fetch
 * per tab, so switching costs nothing and the page still renders complete
 * without JavaScript, which is what the classic experience is for.
 */

type Lens = {
  id: string;
  label: string;
  blurb: string;
  matches: (project: Project) => boolean;
};

const PRODUCT_CATEGORIES = new Set(["AI_INFRASTRUCTURE", "DEVELOPER_TOOLING", "APPLICATION"]);
const SECURITY_CATEGORIES = new Set(["SECURITY", "PROTOCOL"]);

const LENSES: readonly Lens[] = [
  {
    id: "all",
    label: "Everything",
    blurb: "Every published project, newest thinking first.",
    matches: () => true,
  },
  {
    id: "products",
    label: "Products",
    blurb: "Platforms built to be used by people other than their author.",
    matches: (project) => PRODUCT_CATEGORIES.has(project.category) && !project.is_open_source,
  },
  {
    id: "open-source",
    label: "Open source",
    blurb:
      "Free and open source, and staying that way. Built as a contribution back to the community rather than as products.",
    matches: (project) => project.is_open_source,
  },
  {
    id: "security",
    label: "Security and protocol",
    blurb: "Smart contract security, protocol design, and the cryptography underneath.",
    matches: (project) => SECURITY_CATEGORIES.has(project.category),
  },
  {
    id: "ai",
    label: "AI and data",
    blurb: "Model infrastructure, applied machine learning, and document intelligence.",
    matches: (project) =>
      project.category === "AI_INFRASTRUCTURE" ||
      project.category === "DATA" ||
      project.category === "RESEARCH",
  },
];

const DEFAULT_LENS = "all";

export function WorkTabs({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(DEFAULT_LENS);
  const panelId = useId();

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const lens of LENSES) {
      result[lens.id] = projects.filter(lens.matches).length;
    }
    return result;
  }, [projects]);

  // A lens nobody has anything under is not a choice, it is a dead end.
  const available = LENSES.filter((lens) => (counts[lens.id] ?? 0) > 0);
  const current = available.find((lens) => lens.id === active) ?? available[0];
  const shown = current ? projects.filter(current.matches) : projects;

  if (!current) return null;

  return (
    <>
      <div className="edge-fade -mx-1 overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Filter the work"
          className="flex w-max min-w-full items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken/70 p-1 backdrop-blur-sm"
        >
          {available.map((lens) => {
            const selected = lens.id === current.id;

            return (
              <button
                key={lens.id}
                type="button"
                role="tab"
                id={`${panelId}-tab-${lens.id}`}
                aria-selected={selected}
                aria-controls={`${panelId}-panel`}
                onClick={() => setActive(lens.id)}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-[var(--text-small)] font-medium transition-all duration-300 ease-[var(--ease-out)] ${
                  selected
                    ? "bg-surface text-ink shadow-[var(--shadow-lift-1)] ring-1 ring-border-subtle"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                {lens.label}
                <span
                  className={`ml-2 tabular font-mono text-[0.625rem] ${
                    selected ? "text-accent" : "text-ink-faint"
                  }`}
                >
                  {counts[lens.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-5 max-w-[62ch] text-[var(--text-small)] text-ink-muted">{current.blurb}</p>

      <div
        id={`${panelId}-panel`}
        role="tabpanel"
        aria-labelledby={`${panelId}-tab-${current.id}`}
        className="mt-8 grid gap-4 lg:grid-cols-2"
      >
        {shown.map((project, index) => (
          <ProjectCardLink key={project.slug} project={project} index={index} />
        ))}
      </div>
    </>
  );
}
