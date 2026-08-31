"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { StatusBadge, VisibilityBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextArea, TextField, Toggle } from "@/components/primitives/Field";
import type { Project, ProjectStatus, VisibilityLevel } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const VISIBILITY_OPTIONS = [
  { value: "RESTRICTED", label: "Restricted, admin only" },
  { value: "PORTFOLIO", label: "Portfolio, approved for the site" },
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private, owner only" },
];

const CATEGORY_OPTIONS = [
  "AI_INFRASTRUCTURE",
  "BACKEND",
  "PROTOCOL",
  "SECURITY",
  "DEVELOPER_TOOLING",
  "DATA",
  "APPLICATION",
  "RESEARCH",
  "OTHER",
].map((value) => ({ value, label: value.replace(/_/g, " ").toLowerCase() }));

/** What the lifecycle allows from where the project currently sits. */
const NEXT_STEPS: Record<ProjectStatus, ProjectStatus[]> = {
  DISCOVERED: ["ANALYZED", "DRAFT"],
  ANALYZED: ["DRAFT", "BLOCKED"],
  DRAFT: ["REVIEW", "BLOCKED"],
  REVIEW: ["APPROVED", "DRAFT", "BLOCKED"],
  APPROVED: ["PUBLISHED", "DRAFT", "BLOCKED"],
  PUBLISHED: ["APPROVED", "BLOCKED"],
  BLOCKED: ["DRAFT"],
};

const CASE_STUDY: Array<{ field: keyof Project; label: string; hint?: string }> = [
  { field: "summary", label: "Summary", hint: "One paragraph. Required before publishing." },
  { field: "why_it_exists", label: "Why it exists" },
  {
    field: "what_was_built",
    label: "What was built",
    hint: "Required before publishing.",
  },
  { field: "architecture", label: "Architecture" },
  { field: "contribution", label: "Your contribution" },
  { field: "engineering_challenges", label: "Engineering challenges" },
  { field: "result_impact", label: "Result and impact" },
  { field: "lessons", label: "Lessons" },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const resource = useResource<Project>(() => api.get(`/api/v1/admin/projects/${id}`), [id]);

  const [draft, setDraft] = useState<Partial<Project>>({});
  const [error, setError] = useState<{ message: string; reasons?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Opening a different project must not carry the previous one's unsaved
  // edits across. The id is the trigger, not something the body reads.
  // biome-ignore lint/correctness/useExhaustiveDependencies: id is the trigger
  useEffect(() => {
    setDraft({});
    setSaved(false);
  }, [id]);

  if (resource.error && !resource.data) return <ErrorNotice message={resource.error.message} />;
  if (!resource.data) return <Skeleton rows={8} />;

  const project = resource.data;
  const value = <K extends keyof Project>(field: K): Project[K] =>
    (draft[field] ?? project[field]) as Project[K];

  const dirty = Object.keys(draft).length > 0;

  function set<K extends keyof Project>(field: K, next: Project[K]) {
    setDraft((current) => ({ ...current, [field]: next }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/projects/${id}`, draft);
      setDraft({});
      setSaved(true);
      resource.reload();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? { message: caught.message, reasons: caught.reasons }
          : { message: "Could not save." },
      );
    } finally {
      setBusy(false);
    }
  }

  async function transition(status: ProjectStatus) {
    const reason =
      status === "BLOCKED"
        ? (window.prompt("Why is this being blocked? Recorded in the audit log.") ?? undefined)
        : undefined;

    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/v1/admin/projects/${id}/transition`, { status, reason });
      resource.reload();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? { message: caught.message, reasons: caught.reasons }
          : { message: "Could not move the project." },
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${project.slug}? This cannot be undone.`)) return;

    setBusy(true);
    try {
      await api.delete(`/api/v1/admin/projects/${id}`);
      router.push("/admin/projects");
    } catch (caught) {
      setError(
        caught instanceof ApiError ? { message: caught.message } : { message: "Could not delete." },
      );
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.tagline ?? undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <VisibilityBadge level={project.visibility} />
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error.message} reasons={error.reasons} />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Panel title="Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Name"
                value={value("name") ?? ""}
                onChange={(event) => set("name", event.target.value)}
              />
              <TextField
                label="Tagline"
                value={value("tagline") ?? ""}
                onChange={(event) => set("tagline", event.target.value)}
              />
              <SelectField
                label="Category"
                value={value("category") ?? "OTHER"}
                onChange={(next) => set("category", next)}
                options={CATEGORY_OPTIONS}
              />
              <TextField
                label="Role"
                value={value("role") ?? ""}
                onChange={(event) => set("role", event.target.value)}
              />
            </div>
          </Panel>

          <Panel
            title="Case study"
            description="Presented in this order on the public project page."
          >
            <div className="space-y-4">
              {CASE_STUDY.map((section) => (
                <TextArea
                  key={String(section.field)}
                  label={section.label}
                  hint={section.hint}
                  rows={section.field === "summary" ? 3 : 4}
                  value={(value(section.field) as string | null) ?? ""}
                  onChange={(event) => set(section.field, event.target.value as never)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Evidence" description="Where a reader can go to check the claims.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Repository"
                placeholder="https://github.com/..."
                value={value("repository_url") ?? ""}
                onChange={(event) => set("repository_url", event.target.value)}
              />
              <TextField
                label="Documentation"
                value={value("documentation_url") ?? ""}
                onChange={(event) => set("documentation_url", event.target.value)}
              />
              <TextField
                label="Demo"
                value={value("demo_url") ?? ""}
                onChange={(event) => set("demo_url", event.target.value)}
              />
              <TextField
                label="Technologies"
                hint="Comma separated"
                value={(value("technologies") ?? []).join(", ")}
                onChange={(event) =>
                  set(
                    "technologies",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Disclosure">
            <SelectField
              label="Visibility"
              hint="Publishing needs public or portfolio."
              value={value("visibility") ?? "RESTRICTED"}
              onChange={(next) => set("visibility", next as VisibilityLevel)}
              options={VISIBILITY_OPTIONS}
            />
            <div className="mt-2">
              <Toggle
                label="Featured"
                hint="Shown first on the work page."
                checked={value("is_featured") ?? false}
                onChange={(next) => set("is_featured", next)}
              />
            </div>
          </Panel>

          <Panel title="Lifecycle" description={`Currently ${project.status.toLowerCase()}.`}>
            <div className="flex flex-wrap gap-2">
              {NEXT_STEPS[project.status].map((step) => (
                <Button
                  key={step}
                  size="sm"
                  variant={
                    step === "PUBLISHED" ? "primary" : step === "BLOCKED" ? "danger" : "secondary"
                  }
                  busy={busy}
                  onClick={() => void transition(step)}
                >
                  {step === "BLOCKED" ? "Block" : step.toLowerCase()}
                </Button>
              ))}
            </div>
            {project.blocked_reason ? (
              <p className="mt-3 text-[var(--text-caption)] text-critical">
                Blocked: {project.blocked_reason}
              </p>
            ) : null}
            {project.published_at ? (
              <p className="mt-3 text-[var(--text-caption)] text-ink-faint">
                Published {formatDateTime(project.published_at)}
              </p>
            ) : null}
          </Panel>

          <Panel title="Danger">
            <Button variant="danger" size="sm" busy={busy} onClick={() => void remove()}>
              Delete project
            </Button>
            <p className="mt-2 text-[var(--text-caption)] text-ink-faint">
              A published project must be blocked first.
            </p>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 mt-6 flex items-center justify-between gap-3 border-t border-border-subtle bg-paper/90 px-1 py-3 pad-safe-bottom backdrop-blur-xl">
        <p className="text-[var(--text-caption)] text-ink-faint">
          {dirty ? "Unsaved changes" : saved ? "Saved" : "No changes"}
        </p>
        <Button variant="primary" busy={busy} disabled={!dirty} onClick={() => void save()}>
          Save changes
        </Button>
      </div>
    </>
  );
}
