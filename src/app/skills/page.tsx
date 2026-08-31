import type { Metadata } from "next";
import { EmptyNotice } from "@/components/classic/Section";
import { SkillTabs } from "@/components/classic/SkillTabs";
import { Reveal } from "@/components/motion/Reveal";
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

export default async function SkillsPage() {
  let groups: SkillGroup[] = [];

  try {
    groups = await getSkills();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  const total = groups.reduce((sum, group) => sum + group.skills.length, 0);
  const backed = groups.reduce(
    (sum, group) => sum + group.skills.filter((skill) => skill.evidence.length > 0).length,
    0,
  );
  const links = groups.reduce(
    (sum, group) => sum + group.skills.reduce((inner, skill) => inner + skill.evidence.length, 0),
    0,
  );

  return (
    <div className="shell-width py-14 sm:py-20">
      <header className="mb-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-[var(--text-caption)] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm">
          Skills
        </p>
        <h1 className="mt-6 max-w-[20ch] text-[length:var(--text-h1)] font-medium leading-[1] tracking-[-0.04em]">
          <span className="text-gradient">Capabilities, and what backs them</span>
        </h1>
        <p className="mt-5 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
          A skill on its own is a claim. Each one here links to the work that demonstrates it, which
          is the difference between a list and an argument.
        </p>

        {total ? (
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {[
              { value: total, label: "Skills" },
              { value: backed, label: "Backed by evidence" },
              { value: links, label: "Evidence links" },
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

      {groups.length === 0 ? (
        <EmptyNotice
          title="Nothing published yet"
          body="Capabilities appear here once they have been reviewed and approved."
        />
      ) : (
        <Reveal>
          <SkillTabs groups={groups} />
        </Reveal>
      )}
    </div>
  );
}
