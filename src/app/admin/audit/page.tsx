"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { TextField } from "@/components/primitives/Field";
import type { AuditEntry } from "@/lib/admin-types";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const COLUMNS: ReadonlyArray<Column<AuditEntry>> = [
  {
    key: "when",
    header: "When",
    render: (row) => (
      <span className="whitespace-nowrap font-mono text-[var(--text-caption)] text-ink-muted">
        {formatDateTime(row.created_at)}
      </span>
    ),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => <span className="font-mono text-[var(--text-caption)]">{row.action}</span>,
  },
  {
    key: "summary",
    header: "Detail",
    hideBelow: "sm",
    render: (row) => (
      <span className="text-[var(--text-small)] text-ink-muted">{row.summary ?? "-"}</span>
    ),
  },
  {
    key: "actor",
    header: "Who",
    hideBelow: "md",
    render: (row) => (
      <span className="text-[var(--text-caption)] text-ink-faint">{row.actor_email ?? "-"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    hideBelow: "lg",
    align: "right",
    render: (row) => (
      <span
        className={`tabular font-mono text-[var(--text-caption)] ${
          row.status_code && row.status_code >= 400 ? "text-critical" : "text-ink-faint"
        }`}
      >
        {row.status_code ?? "-"}
      </span>
    ),
  },
];

export default function AuditPage() {
  const [action, setAction] = useState("");

  const entries = useResource<AuditEntry[]>(
    () => api.get("/api/v1/admin/audit", { limit: 200, action: action || undefined }),
    [action],
  );

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every administrative change, in the same transaction as the change itself. Reads are not recorded, and a request that was refused wrote nothing."
      />

      <Panel padded={false}>
        <div className="border-b border-border-subtle p-4">
          <div className="max-w-xs">
            <TextField
              label="Filter by action"
              placeholder="knowledge.approved"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            />
          </div>
        </div>

        {entries.error ? (
          <div className="p-5">
            <ErrorNotice message={entries.error.message} />
          </div>
        ) : entries.loading || !entries.data ? (
          <Skeleton rows={6} />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={entries.data}
            emptyState={<EmptyState title="Nothing recorded yet" />}
          />
        )}
      </Panel>
    </>
  );
}
