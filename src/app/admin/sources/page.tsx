"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable, Pager } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Panel, RefreshBar, Skeleton } from "@/components/admin/Panel";
import { Badge, VisibilityBadge } from "@/components/primitives/Badge";
import type { Page, Source } from "@/lib/admin-types";
import { api } from "@/lib/api";
import { formatBytes, formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const LIMIT = 25;

const COLUMNS: ReadonlyArray<Column<Source>> = [
  {
    key: "title",
    header: "Source",
    render: (row) => (
      <div className="min-w-0 max-w-[46ch]">
        <p className="truncate font-medium">{row.title}</p>
        <p className="truncate font-mono text-[var(--text-caption)] text-ink-faint">{row.kind}</p>
      </div>
    ),
  },
  {
    key: "redacted",
    header: "Redacted",
    render: (row) =>
      row.was_redacted ? (
        <Badge tone="caution">stripped</Badge>
      ) : (
        <span className="text-[var(--text-caption)] text-ink-faint">clean</span>
      ),
  },
  {
    key: "visibility",
    header: "Visibility",
    hideBelow: "sm",
    render: (row) => <VisibilityBadge level={row.visibility} />,
  },
  {
    key: "size",
    header: "Size",
    hideBelow: "lg",
    align: "right",
    render: (row) => (
      <span className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
        {formatBytes(row.byte_size)}
      </span>
    ),
  },
  {
    key: "collected",
    header: "Collected",
    hideBelow: "md",
    align: "right",
    render: (row) => (
      <span className="text-[var(--text-caption)] text-ink-faint">
        {formatRelative(row.collected_at)}
      </span>
    ),
  },
];

export default function SourcesPage() {
  const [offset, setOffset] = useState(0);

  const sources = useResource<Page<Source>>(
    () => api.get("/api/v1/admin/sources", { limit: LIMIT, offset }),
    [offset],
  );

  return (
    <>
      <PageHeader
        title="Sources"
        description="Where the knowledge came from. Anything marked stripped had a secret removed before it was stored, so the value itself is not here to leak."
      />

      <Panel padded={false}>
        <RefreshBar active={sources.refreshing} />

        {sources.error && !sources.data ? (
          <div className="p-5">
            <ErrorNotice message={sources.error.message} />
          </div>
        ) : !sources.data ? (
          <Skeleton rows={5} />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={sources.data.items}
              emptyState={
                <EmptyState
                  title="No sources collected yet"
                  hint="Connect GitHub and run a sync to start collecting."
                />
              }
            />
            <Pager
              total={sources.data.total}
              limit={sources.data.limit}
              offset={sources.data.offset}
              onChange={setOffset}
            />
          </>
        )}
      </Panel>
    </>
  );
}
