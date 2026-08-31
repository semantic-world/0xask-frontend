"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { Skill, SkillGroup } from "@/lib/server-api";

/**
 * Thirty skills across nine categories, made scannable.
 *
 * As one long page it was nine headings deep and the thing someone came to
 * check was somewhere in the middle. The tabs are the categories themselves,
 * which is the axis skills actually divide along, and the filter cuts across
 * all of them at once: a visitor who wants to know whether he has used a
 * particular thing should not have to guess which heading it lives under.
 *
 * The filter matches the evidence as well as the skill, so typing a project
 * name shows what that project demonstrates.
 *
 * Everything is filtered in memory. Without JavaScript the page still renders
 * every skill under every heading, which is what the classic experience is for.
 */

const CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  INFRASTRUCTURE: "Infrastructure",
  AI: "AI",
  BLOCKCHAIN: "Blockchain and protocol",
  SECURITY: "Security",
  DATABASE: "Databases",
  CLOUD: "Cloud",
  DEVOPS: "Operations",
  ARCHITECTURE: "Architecture",
  PRACTICE: "Practice",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category.replace(/_/g, " ").toLowerCase();
}

const ALL = "all";

function matches(skill: Skill, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    skill.name,
    skill.summary ?? "",
    ...skill.evidence.map((entry) => `${entry.project_name ?? ""} ${entry.note ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function SkillTabs({ groups }: { groups: SkillGroup[] }) {
  const [active, setActive] = useState(ALL);
  const [query, setQuery] = useState("");
  const panelId = useId();
  const searchId = useId();

  const needle = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      groups
        .map((group) => ({
          category: group.category,
          skills: group.skills.filter((skill) => matches(skill, needle)),
        }))
        .filter((group) => group.skills.length > 0),
    [groups, needle],
  );

  const total = filtered.reduce((sum, group) => sum + group.skills.length, 0);
  // A tab with nothing behind it is not a choice. When a filter empties a
  // category, that category stops being offered rather than offering nothing.
  const shown = filtered.filter((group) => active === ALL || group.category === active);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="edge-fade -mx-1 min-w-0 overflow-x-auto pb-1">
          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex w-max min-w-full items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken/70 p-1 backdrop-blur-sm"
          >
            <Tab
              id={`${panelId}-tab-${ALL}`}
              controls={panelId}
              label="Everything"
              count={total}
              selected={active === ALL}
              onSelect={() => setActive(ALL)}
            />
            {filtered.map((group) => (
              <Tab
                key={group.category}
                id={`${panelId}-tab-${group.category}`}
                controls={panelId}
                label={categoryLabel(group.category)}
                count={group.skills.length}
                selected={active === group.category}
                onSelect={() => setActive(group.category)}
              />
            ))}
          </div>
        </div>

        <div className="relative shrink-0 lg:w-72">
          <label htmlFor={searchId} className="sr-only">
            Search skills and the work behind them
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills or projects"
            className="w-full rounded-full border border-border-subtle bg-surface/70 px-4 py-2 text-[var(--text-small)] backdrop-blur-sm transition-colors duration-300 placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div id={panelId} className="mt-10 space-y-12">
        {shown.length === 0 ? (
          <p className="text-ink-muted">
            Nothing matches <span className="text-ink">{query}</span>.
          </p>
        ) : (
          shown.map((group) => (
            <section key={group.category}>
              <h2 className="mb-5 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
                {categoryLabel(group.category)}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((skill) => (
                  <SkillCard key={skill.slug} skill={skill} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}

function Tab({
  id,
  controls,
  label,
  count,
  selected,
  onSelect,
}: {
  id: string;
  controls: string;
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={controls}
      onClick={onSelect}
      className={`relative whitespace-nowrap rounded-full px-4 py-2 text-[var(--text-small)] font-medium transition-all duration-300 ease-[var(--ease-out)] ${
        selected
          ? "bg-surface text-ink shadow-[var(--shadow-lift-1)] ring-1 ring-border-subtle"
          : "text-ink-faint hover:text-ink-muted"
      }`}
    >
      {label}
      <span
        className={`ml-2 tabular font-mono text-[0.625rem] ${
          selected ? "text-accent" : "text-ink-faint"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <li className="group rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-5 transition-[border-color,transform] duration-500 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[length:var(--text-h4)] font-medium">{skill.name}</h3>
        {skill.years_of_use ? (
          <span className="tabular shrink-0 font-mono text-[var(--text-caption)] text-ink-faint">
            {skill.years_of_use}y
          </span>
        ) : null}
      </div>

      {skill.summary ? (
        <p className="mt-2 text-[var(--text-small)] text-ink-muted">{skill.summary}</p>
      ) : null}

      {skill.evidence.length ? (
        <div className="mt-4 border-t border-border-subtle pt-3">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
            Evidence
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {skill.evidence.map((entry) =>
              entry.project_slug ? (
                <li key={entry.project_slug}>
                  <Link
                    href={`/projects/${entry.project_slug}`}
                    title={entry.note ?? undefined}
                    className="text-[var(--text-caption)] text-accent hover:underline"
                  >
                    {entry.project_name}
                  </Link>
                </li>
              ) : entry.note ? (
                <li key={entry.note} className="text-[var(--text-caption)] text-ink-faint">
                  {entry.note}
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
