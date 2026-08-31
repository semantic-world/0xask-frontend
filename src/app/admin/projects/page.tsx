"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable, Pager } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Panel, RefreshBar, Skeleton } from "@/components/admin/Panel";
import { StatusBadge, VisibilityBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import type { Page, ProjectSummary } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const STATUSES = [
  "",
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "PUBLISHED",
  "BLOCKED",
  "DISCOVERED",
  "ANALYZED",
] as const;

const LIMIT = 25;

const COLUMNS: ReadonlyArray<Column<ProjectSummary>> = [
  {
    key: "name",
    header: "Project",
    render: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.name}</p>
        <p className="truncate font-mono text-[var(--text-caption)] text-ink-faint">{row.slug}</p>
      </div>
    ),
  },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  {
    key: "visibility",
    header: "Visibility",
    hideBelow: "sm",
    render: (row) => <VisibilityBadge level={row.visibility} />,
  },
  {
    key: "category",
    header: "Category",
    hideBelow: "lg",
    render: (row) => (
      <span className="font-mono text-[var(--text-caption)] text-ink-muted">{row.category}</span>
    ),
  },
  {
    key: "updated",
    header: "Updated",
    hideBelow: "md",
    align: "right",
    render: (row) => (
      <span className="text-[var(--text-caption)] text-ink-faint">
        {formatRelative(row.updated_at)}
      </span>
    ),
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [creating, setCreating] = useState(false);

  const projects = useResource<Page<ProjectSummary>>(
    () =>
      api.get("/api/v1/admin/projects", {
        status: status || undefined,
        search: search || undefined,
        limit: LIMIT,
        offset,
      }),
    [status, search, offset],
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="GitHub discovers. You curate. Nothing here reaches a visitor until you publish it."
        action={
          <Button variant="primary" onClick={() => setCreating(true)}>
            New project
          </Button>
        }
      />

      {creating ? (
        <div className="mb-4">
          <CreateProject
            onCancel={() => setCreating(false)}
            onCreated={(id) => router.push(`/admin/projects/${id}`)}
          />
        </div>
      ) : null}

      <Panel padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-border-subtle p-4">
          <div className="min-w-[12rem] flex-1">
            <TextField
              label="Search"
              placeholder="Name, slug, or tagline"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((option) => (
              <button
                key={option || "all"}
                type="button"
                onClick={() => {
                  setStatus(option);
                  setOffset(0);
                }}
                className={`rounded-full border px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors ${
                  status === option
                    ? "border-accent bg-accent-wash text-ink"
                    : "border-border-subtle text-ink-faint hover:border-border-strong hover:text-ink-muted"
                }`}
              >
                {option || "All"}
              </button>
            ))}
          </div>
        </div>

        <RefreshBar active={projects.refreshing} />

        {projects.error && !projects.data ? (
          <div className="p-5">
            <ErrorNotice message={projects.error.message} />
          </div>
        ) : !projects.data ? (
          <Skeleton rows={5} />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={projects.data.items}
              onRowClick={(row) => router.push(`/admin/projects/${row.id}`)}
              emptyState={
                <EmptyState
                  title="No projects match"
                  hint="Create one by hand, or connect GitHub and let discovery find them."
                />
              }
            />
            <Pager
              total={projects.data.total}
              limit={projects.data.limit}
              offset={projects.data.offset}
              onChange={setOffset}
            />
          </>
        )}
      </Panel>
    </>
  );
}

function CreateProject({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const created = await api.post<{ id: string }>("/api/v1/admin/projects", {
        slug: slug || slugify(name),
        name,
      });
      onCreated(created.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create the project.");
      setBusy(false);
    }
  }

  return (
    <Panel
      title="New project"
      description="It starts as a restricted draft. Nothing is exposed by creating it."
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? <ErrorNotice message={error} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Slug"
            hint="Used in the public URL. Left empty, it follows the name."
            placeholder={slugify(name) || "project-name"}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" busy={busy}>
            Create
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
