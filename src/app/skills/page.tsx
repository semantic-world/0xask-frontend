import type { Metadata } from "next";
import Link from "next/link";
import { EmptyNotice } from "@/components/classic/Section";
import { getSkills, NotPublished, type SkillGroup } from "@/lib/server-api";

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
  alternates: { canonical: "/skills" },
  title: "Skills",
  description: "Technical capabilities, each linked to the work that demonstrates it.",
};

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

export default async function SkillsPage() {
  let groups: SkillGroup[] = [];

  try {
    groups = await getSkills();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  return (
    <div className="shell-width py-14 sm:py-20">
      <header className="mb-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
          Skills
        </p>
        <h1 className="mt-6 max-w-[22ch] text-[length:var(--text-h1)] font-medium leading-[1] tracking-[-0.04em]">
          Capabilities, and what backs them
        </h1>
        <p className="mt-5 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
          A skill on its own is a claim. Each one here links to the work that demonstrates it, which
          is the difference between a list and an argument.
        </p>
      </header>

      {groups.length === 0 ? (
        <EmptyNotice
          title="Nothing published yet"
          body="Capabilities appear here once they have been reviewed and approved."
        />
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="mb-5 font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
                {CATEGORY_LABEL[group.category] ?? group.category.toLowerCase()}
              </h2>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((skill) => (
                  <li
                    key={skill.slug}
                    className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[length:var(--text-h4)] font-medium">{skill.name}</h3>
                      {skill.years_of_use ? (
                        <span className="tabular shrink-0 font-mono text-[var(--text-caption)] text-ink-faint">
                          {skill.years_of_use}y
                        </span>
                      ) : null}
                    </div>

                    {skill.summary ? (
                      <p className="mt-2 text-[var(--text-small)] text-ink-muted">
                        {skill.summary}
                      </p>
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
                                  className="text-[var(--text-caption)] text-accent hover:underline"
                                >
                                  {entry.project_name}
                                </Link>
                              </li>
                            ) : entry.note ? (
                              <li
                                key={entry.note}
                                className="text-[var(--text-caption)] text-ink-faint"
                              >
                                {entry.note}
                              </li>
                            ) : null,
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
