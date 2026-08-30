"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable, Pager } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { StatusBadge, VisibilityBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextArea, TextField } from "@/components/primitives/Field";
import type { KnowledgeItem, Page, VisibilityLevel } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const LIMIT = 25;

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const VISIBILITY_OPTIONS = [
  { value: "", label: "Any visibility" },
  { value: "PUBLIC", label: "Public" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "PRIVATE", label: "Private" },
  { value: "SECRET", label: "Secret" },
];

const ASSIGNABLE = VISIBILITY_OPTIONS.filter((option) => option.value && option.value !== "SECRET");

export default function KnowledgePage() {
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<KnowledgeItem | null>(null);

  const knowledge = useResource<Page<KnowledgeItem>>(
    () =>
      api.get("/api/v1/admin/knowledge", {
        status: status || undefined,
        visibility: visibility || undefined,
        search: search || undefined,
        limit: LIMIT,
        offset,
      }),
    [status, visibility, search, offset],
  );

  const columns: ReadonlyArray<Column<KnowledgeItem>> = [
    {
      key: "statement",
      header: "Claim",
      render: (row) => <p className="max-w-[56ch] text-balance-tight">{row.statement}</p>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.approval_status} />,
    },
    {
      key: "visibility",
      header: "Visibility",
      hideBelow: "sm",
      render: (row) => <VisibilityBadge level={row.visibility} />,
    },
    {
      key: "created",
      header: "Added",
      hideBelow: "md",
      align: "right",
      render: (row) => (
        <span className="text-[var(--text-caption)] text-ink-faint">
          {formatRelative(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="Every fact the system holds, including the ones it will never say. Knowing what has been withheld is the point of this view."
      />

      {open ? (
        <div className="mb-4">
          <KnowledgeDetail
            item={open}
            onClose={() => setOpen(null)}
            onChanged={() => {
              setOpen(null);
              knowledge.reload();
            }}
          />
        </div>
      ) : null}

      <Panel padded={false}>
        <div className="grid gap-3 border-b border-border-subtle p-4 sm:grid-cols-3">
          <TextField
            label="Search"
            placeholder="Words in the claim"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(next) => {
              setStatus(next);
              setOffset(0);
            }}
            options={STATUS_OPTIONS}
          />
          <SelectField
            label="Visibility"
            value={visibility}
            onChange={(next) => {
              setVisibility(next);
              setOffset(0);
            }}
            options={VISIBILITY_OPTIONS}
          />
        </div>

        {knowledge.error ? (
          <div className="p-5">
            <ErrorNotice message={knowledge.error.message} />
          </div>
        ) : knowledge.loading || !knowledge.data ? (
          <Skeleton rows={6} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={knowledge.data.items}
              onRowClick={setOpen}
              emptyState={
                <EmptyState
                  title="Nothing matches"
                  hint="Knowledge arrives from ingestion once GitHub is connected."
                />
              }
            />
            <Pager
              total={knowledge.data.total}
              limit={knowledge.data.limit}
              offset={knowledge.data.offset}
              onChange={setOffset}
            />
          </>
        )}
      </Panel>
    </>
  );
}

function KnowledgeDetail({
  item,
  onClose,
  onChanged,
}: {
  item: KnowledgeItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [statement, setStatement] = useState(item.statement);
  const [visibility, setVisibility] = useState<VisibilityLevel>(item.visibility);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edited = statement !== item.statement;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not work.");
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Knowledge item"
      description={`Version ${item.current_version}. Editing the wording returns an approved item to pending.`}
      action={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorNotice message={error} /> : null}

        <TextArea
          label="Statement"
          rows={3}
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Visibility"
            hint="Secret cannot be set here. Secrets are excluded during ingestion."
            value={visibility}
            onChange={(next) => setVisibility(next as VisibilityLevel)}
            options={ASSIGNABLE}
          />
          <div className="flex flex-col justify-end gap-1.5">
            <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-faint">
              Current
            </span>
            <div className="flex gap-2">
              <StatusBadge status={item.approval_status} />
              <VisibilityBadge level={item.visibility} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
          <Button
            variant="secondary"
            size="sm"
            busy={busy}
            disabled={!edited && visibility === item.visibility}
            onClick={() =>
              void run(() =>
                api.patch(`/api/v1/admin/knowledge/${item.id}`, {
                  statement: edited ? statement : undefined,
                  visibility: visibility !== item.visibility ? visibility : undefined,
                }),
              )
            }
          >
            Save edit
          </Button>
          <Button
            variant="primary"
            size="sm"
            busy={busy}
            onClick={() =>
              void run(() => api.post(`/api/v1/admin/knowledge/${item.id}/approve`, { visibility }))
            }
          >
            Approve as {visibility.toLowerCase()}
          </Button>
          <Button
            variant="danger"
            size="sm"
            busy={busy}
            onClick={() =>
              void run(() =>
                api.post(`/api/v1/admin/knowledge/${item.id}/reject`, {
                  reason: window.prompt("Why is this being rejected?") ?? undefined,
                }),
              )
            }
          >
            Reject
          </Button>
        </div>
      </div>
    </Panel>
  );
}
