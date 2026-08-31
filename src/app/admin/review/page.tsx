"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable, Pager } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Panel, RefreshBar, Skeleton } from "@/components/admin/Panel";
import { Badge, VisibilityBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { SelectField } from "@/components/primitives/Field";
import type { KnowledgeItem, Page, VisibilityLevel } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const LIMIT = 50;

const APPROVE_AS = [
  { value: "PORTFOLIO", label: "Portfolio, approved for the site" },
  { value: "PUBLIC", label: "Public" },
  { value: "RESTRICTED", label: "Restricted, admin only" },
];

export default function ReviewPage() {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibility, setVisibility] = useState<VisibilityLevel>("PORTFOLIO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queue = useResource<Page<KnowledgeItem>>(
    () => api.get("/api/v1/admin/knowledge/queue", { limit: LIMIT, offset }),
    [offset],
  );

  const columns: ReadonlyArray<Column<KnowledgeItem>> = [
    {
      key: "statement",
      header: "Claim",
      render: (row) => (
        <div className="min-w-0 max-w-[52ch]">
          <p className="text-balance-tight">{row.statement}</p>
          <p className="mt-1 font-mono text-[var(--text-caption)] text-ink-faint">
            {row.kind} on {row.subject_type.toLowerCase()}
          </p>
        </div>
      ),
    },
    {
      key: "suggested",
      header: "Suggested",
      hideBelow: "sm",
      render: (row) =>
        row.suggested_visibility ? (
          <VisibilityBadge level={row.suggested_visibility} />
        ) : (
          <span className="text-[var(--text-caption)] text-ink-faint">none</span>
        ),
    },
    {
      key: "confidence",
      header: "Confidence",
      hideBelow: "lg",
      render: (row) => <Badge>{row.confidence}</Badge>,
    },
    {
      key: "created",
      header: "Waiting",
      hideBelow: "md",
      align: "right",
      render: (row) => (
        <span className="text-[var(--text-caption)] text-ink-faint">
          {formatRelative(row.created_at)}
        </span>
      ),
    },
  ];

  async function decide(action: "approve" | "reject") {
    if (selected.size === 0) return;

    const ids = [...selected];
    const reason =
      action === "reject"
        ? (window.prompt("Why are these being rejected? Recorded in the audit log.") ?? undefined)
        : undefined;

    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/v1/admin/knowledge/bulk/${action}`, {
        ids,
        visibility: action === "approve" ? visibility : undefined,
        reason,
      });
      setSelected(new Set());

      // Decided claims leave the queue, so they go now rather than after a
      // round trip that rebuilds the table underneath the reviewer. Working
      // through a queue of fifty means fifty of these, and a redraw each time
      // loses their place every time.
      const decided = new Set(ids);
      queue.mutate((page) => ({
        ...page,
        total: Math.max(0, page.total - decided.size),
        items: page.items.filter((item) => !decided.has(item.id)),
      }));

      // Then refill quietly, so the next page of work arrives without the
      // reviewer waiting for it.
      queue.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not apply that decision.");
      queue.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Nothing here has been seen by a visitor. Approving is the only thing that changes that, and the suggestion beside each claim is a recommendation, not a decision."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      <Panel padded={false}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-subtle p-4">
          <div className="w-full max-w-xs">
            <SelectField
              label="Approve as"
              value={visibility}
              onChange={(next) => setVisibility(next as VisibilityLevel)}
              options={APPROVE_AS}
              disabled={selected.size === 0}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular mr-1 font-mono text-[var(--text-caption)] text-ink-faint">
              {selected.size} selected
            </span>
            <Button
              variant="primary"
              size="sm"
              busy={busy}
              disabled={selected.size === 0}
              onClick={() => void decide("approve")}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              busy={busy}
              disabled={selected.size === 0}
              onClick={() => void decide("reject")}
            >
              Reject
            </Button>
          </div>
        </div>

        <RefreshBar active={queue.refreshing} />

        {queue.error && !queue.data ? (
          <div className="p-5">
            <ErrorNotice message={queue.error.message} />
          </div>
        ) : !queue.data ? (
          <Skeleton rows={6} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={queue.data.items}
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              emptyState={
                <EmptyState
                  title="The queue is clear"
                  hint="Everything discovered so far has been decided on."
                />
              }
            />
            <Pager
              total={queue.data.total}
              limit={queue.data.limit}
              offset={queue.data.offset}
              onChange={setOffset}
            />
          </>
        )}
      </Panel>
    </>
  );
}
