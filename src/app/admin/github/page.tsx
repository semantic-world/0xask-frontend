"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import type { Column } from "@/components/admin/DataTable";
import { DataTable, Pager } from "@/components/admin/DataTable";
import { EmptyState, ErrorNotice, Metric, Panel, Skeleton } from "@/components/admin/Panel";
import { Badge, StatusBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import type { GithubStatus, Page as PageOf, Repository, SyncRun } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const LIMIT = 25;

export default function GithubPage() {
  const status = useResource<GithubStatus>(() => api.get("/api/v1/admin/github/status"), []);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRepo, setPendingRepo] = useState<string | null>(null);

  const repositories = useResource<PageOf<Repository>>(
    () =>
      api.get("/api/v1/admin/github/repositories", {
        limit: LIMIT,
        offset,
        search: search || undefined,
      }),
    [offset, search],
  );

  const runs = useResource<SyncRun[]>(
    () => api.get("/api/v1/admin/github/sync-runs", { limit: 5 }),
    [],
  );

  async function syncNow() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/v1/admin/github/sync");
      status.reload();
      runs.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not queue a sync.");
    } finally {
      setBusy(false);
    }
  }

  async function setDisclosure(repository: Repository, allowed: boolean) {
    setPendingRepo(repository.id);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/github/repositories/${repository.id}`, {
        disclosure_allowed: allowed,
      });
      repositories.reload();
      status.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not change that repository.");
    } finally {
      setPendingRepo(null);
    }
  }

  const columns: ReadonlyArray<Column<Repository>> = [
    {
      key: "name",
      header: "Repository",
      render: (row) => (
        <div className="min-w-0 max-w-[34ch]">
          <p className="truncate font-medium">{row.full_name}</p>
          {row.description ? (
            <p className="truncate text-[var(--text-caption)] text-ink-faint">{row.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "visibility",
      header: "On GitHub",
      render: (row) => (
        <Badge tone={row.visibility === "PUBLIC" ? "neutral" : "critical"}>{row.visibility}</Badge>
      ),
    },
    {
      key: "disclosure",
      header: "Disclosure",
      render: (row) =>
        row.visibility !== "PUBLIC" ? (
          <span className="text-[var(--text-caption)] text-ink-faint">blocked</span>
        ) : (
          <Button
            size="sm"
            variant={row.disclosure_allowed ? "primary" : "secondary"}
            busy={pendingRepo === row.id}
            onClick={() => void setDisclosure(row, !row.disclosure_allowed)}
          >
            {row.disclosure_allowed ? "Allowed" : "Not allowed"}
          </Button>
        ),
    },
    {
      key: "secrets",
      header: "Secrets",
      hideBelow: "lg",
      align: "right",
      render: (row) =>
        row.secrets_detected > 0 ? (
          <Badge tone="caution">{row.secrets_detected} removed</Badge>
        ) : (
          <span className="text-[var(--text-caption)] text-ink-faint">none</span>
        ),
    },
    {
      key: "synced",
      header: "Synced",
      hideBelow: "md",
      align: "right",
      render: (row) => (
        <span className="text-[var(--text-caption)] text-ink-faint">
          {formatRelative(row.last_synced_at)}
        </span>
      ),
    },
  ];

  if (status.error) return <ErrorNotice message={status.error.message} />;
  if (status.loading || !status.data) return <Skeleton rows={6} />;

  const connected = status.data.connected;

  return (
    <>
      <PageHeader
        title="GitHub"
        description="Persistent ingestion. The system reads GitHub on a schedule and on demand, never on a visitor's request."
        action={
          connected ? (
            <Button variant="primary" busy={busy} onClick={() => void syncNow()}>
              Sync now
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      {!connected ? (
        <Connect
          onConnected={() => {
            status.reload();
            repositories.reload();
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Repositories"
              value={status.data.repositories}
              hint={`${status.data.tracked_repositories} tracked`}
            />
            <Metric
              label="Private"
              value={status.data.private_repositories}
              hint="Metadata only, never read"
            />
            <Metric label="Accounts" value={status.data.accounts} />
            <Metric
              label="Next sync"
              value={formatRelative(status.data.next_scheduled_sync_at)}
              hint="Every thirty days"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Panel title="Connection">
              <dl className="space-y-3">
                <Row label="Identity" value={status.data.login ?? "unknown"} />
                <Row label="Token" value={status.data.token_hint ?? "stored"} />
                <Row label="Connected" value={formatRelative(status.data.connected_at)} />
              </dl>
              <div className="mt-4 border-t border-border-subtle pt-4">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (
                      !window.confirm("Remove the stored token? Discovered repositories are kept.")
                    ) {
                      return;
                    }
                    void api.delete("/api/v1/admin/github/connect").then(() => status.reload());
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </Panel>

            <Panel title="Recent syncs" padded={false}>
              {runs.loading || !runs.data ? (
                <Skeleton rows={3} />
              ) : runs.data.length === 0 ? (
                <EmptyState title="Nothing has run yet" hint="Press Sync now to discover." />
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {runs.data.map((run) => (
                    <li key={run.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={run.outcome} />
                          <span className="font-mono text-[var(--text-caption)] text-ink-faint">
                            {run.trigger.toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-[var(--text-caption)] text-ink-muted">
                          {run.repositories_discovered} found, {run.repositories_changed} changed,{" "}
                          {run.repositories_skipped} unchanged
                          {run.secrets_detected > 0
                            ? `, ${run.secrets_detected} credential(s) removed`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[var(--text-caption)] text-ink-faint">
                        {formatRelative(run.started_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Repository inventory"
              description="Private repositories appear here and nowhere else. Only a public repository can be cleared for disclosure, and clearing one is what lets its content enter the knowledge pipeline."
              padded={false}
            >
              <div className="border-b border-border-subtle p-4">
                <div className="max-w-xs">
                  <TextField
                    label="Search"
                    placeholder="owner/name"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setOffset(0);
                    }}
                  />
                </div>
              </div>

              {repositories.loading || !repositories.data ? (
                <Skeleton rows={5} />
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    rows={repositories.data.items}
                    emptyState={
                      <EmptyState
                        title="Nothing discovered yet"
                        hint="Run a sync to build the inventory."
                      />
                    }
                  />
                  <Pager
                    total={repositories.data.total}
                    limit={repositories.data.limit}
                    offset={repositories.data.offset}
                    onChange={setOffset}
                  />
                </>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--text-small)] text-ink-muted">{label}</dt>
      <dd className="truncate font-mono text-[var(--text-small)]">{value}</dd>
    </div>
  );
}

function Connect({ onConnected }: { onConnected: () => void }) {
  const [login, setLogin] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/v1/admin/github/connect", { login, token });
      setToken("");
      onConnected();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Connect GitHub"
      description="The token is checked against GitHub, then stored encrypted. It never reaches the browser again and never appears in the audit log."
    >
      <form onSubmit={submit} className="max-w-lg space-y-4">
        {error ? <ErrorNotice message={error} /> : null}

        <TextField
          label="GitHub username"
          placeholder="0xSemantic"
          required
          value={login}
          onChange={(event) => setLogin(event.target.value)}
        />
        <TextField
          label="Personal access token"
          type="password"
          autoComplete="off"
          required
          hint="Read access is enough. Grant the least this needs: public repository metadata, and organization membership if you want organization repositories discovered."
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <Button type="submit" variant="primary" busy={busy}>
          Connect
        </Button>
      </form>
    </Panel>
  );
}
