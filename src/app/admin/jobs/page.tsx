"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable } from "@/components/admin/DataTable";
import {
  EmptyState,
  ErrorNotice,
  Metric,
  Panel,
  RefreshBar,
  Skeleton,
} from "@/components/admin/Panel";
import { StatusBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import type { Job, JobSummary } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const COLUMNS: ReadonlyArray<Column<Job>> = [
  {
    key: "kind",
    header: "Job",
    render: (row) => <span className="font-mono text-[var(--text-caption)]">{row.kind}</span>,
  },
  { key: "state", header: "State", render: (row) => <StatusBadge status={row.state} /> },
  {
    key: "attempts",
    header: "Attempts",
    hideBelow: "sm",
    render: (row) => (
      <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
        {row.attempts}/{row.max_attempts}
      </span>
    ),
  },
  {
    key: "detail",
    header: "Outcome",
    hideBelow: "md",
    render: (row) => (
      <span
        className={`text-[var(--text-caption)] ${row.last_error ? "text-critical" : "text-ink-faint"}`}
      >
        {row.last_error
          ? row.last_error.split("\n")[0]?.slice(0, 90)
          : row.result
            ? JSON.stringify(row.result).slice(0, 90)
            : "-"}
      </span>
    ),
  },
  {
    key: "when",
    header: "Ran",
    align: "right",
    hideBelow: "lg",
    render: (row) => (
      <span className="text-[var(--text-caption)] text-ink-faint">
        {formatRelative(row.finished_at ?? row.run_at)}
      </span>
    ),
  },
];

export default function JobsPage() {
  const jobs = useResource<JobSummary>(() => api.get("/api/v1/admin/jobs", { limit: 30 }), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: string) {
    setBusy(kind);
    setError(null);
    try {
      await api.post(`/api/v1/admin/jobs/${kind}`);
      jobs.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not queue that job.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Background work"
        description="Sync, analysis, and embedding run here so a visitor's request never waits on them."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      <RefreshBar active={jobs.refreshing} />

      {jobs.error && !jobs.data ? (
        <ErrorNotice message={jobs.error.message} />
      ) : !jobs.data ? (
        <Skeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["PENDING", "RUNNING", "SUCCEEDED", "FAILED"].map((state) => (
              <Metric
                key={state}
                label={state.toLowerCase()}
                value={jobs.data?.counts[state] ?? 0}
                tone={
                  state === "FAILED" && (jobs.data?.counts[state] ?? 0) > 0 ? "critical" : "neutral"
                }
              />
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <Panel
              title="Run a job"
              description="Queued immediately. Running the same kind twice does not start two."
            >
              <div className="flex flex-wrap gap-2">
                {jobs.data.registered_kinds.map((kind) => (
                  <Button key={kind} size="sm" busy={busy === kind} onClick={() => void run(kind)}>
                    {kind}
                  </Button>
                ))}
              </div>
            </Panel>

            <Panel title="Recent" padded={false}>
              <DataTable
                columns={COLUMNS}
                rows={jobs.data.recent}
                emptyState={<EmptyState title="Nothing has run yet" />}
              />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
