"use client";

import Link from "next/link";
import { PageHeader } from "@/components/admin/AdminShell";
import { EmptyState, ErrorNotice, Metric, Panel, Skeleton } from "@/components/admin/Panel";
import { VisibilityBadge } from "@/components/primitives/Badge";
import type { Dashboard, Disclosure } from "@/lib/admin-types";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

export default function DashboardPage() {
  const dashboard = useResource<Dashboard>(() => api.get("/api/v1/admin/dashboard"), []);
  const disclosure = useResource<Disclosure>(() => api.get("/api/v1/admin/disclosure"), []);

  if (dashboard.error) {
    return <ErrorNotice message={dashboard.error.message} />;
  }

  if (dashboard.loading || !dashboard.data) {
    return <Skeleton rows={6} />;
  }

  const data = dashboard.data;
  const published = data.projects.PUBLISHED ?? 0;
  const drafts = (data.projects.DRAFT ?? 0) + (data.projects.REVIEW ?? 0);
  const pending = data.knowledge.pending_review;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data.profile_name
            ? `The state of ${data.profile_name}'s portfolio intelligence system.`
            : "The state of the system."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Published projects" value={published} hint={`${drafts} in progress`} />
        <Metric
          label="Awaiting review"
          value={pending}
          tone={pending > 0 ? "caution" : "neutral"}
          hint={pending > 0 ? "Nothing is public until you decide" : "The queue is clear"}
        />
        <Metric
          label="Repositories"
          value={data.repositories.total ?? 0}
          hint={`${data.repositories.tracked ?? 0} tracked, ${data.repositories.private ?? 0} private`}
        />
        <Metric
          label="Secrets detected"
          value={disclosure.data?.secrets_detected ?? 0}
          tone={(disclosure.data?.secrets_detected ?? 0) > 0 ? "critical" : "positive"}
          hint="Stripped before any model sees them"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Public surface"
          description="What a visitor can currently reach. Both are off until you turn them on."
        >
          <dl className="space-y-3">
            <Row label="Classic site" value={data.site_published ? "Live" : "Not published"} />
            <Row label="0xAsk" value={data.ask_enabled ? "Answering" : "Disabled"} />
            <Row
              label="Approved and public"
              value={String(disclosure.data?.approved_public ?? 0)}
            />
          </dl>
        </Panel>

        <Panel
          title="GitHub"
          description="Persistent ingestion, not discovery on every visit."
          action={
            <Link
              href="/admin/github"
              className="text-[var(--text-small)] font-medium text-accent hover:underline"
            >
              Manage
            </Link>
          }
        >
          {data.github_connected ? (
            <dl className="space-y-3">
              <Row label="Identity" value={data.github_login ?? "unknown"} />
              <Row label="Last sync" value={formatRelative(data.last_sync_at)} />
              <Row label="Next scheduled" value={formatRelative(data.next_sync_at)} />
            </dl>
          ) : (
            <EmptyState
              title="Not connected"
              hint="Connect a GitHub identity to start discovering repositories."
            />
          )}
        </Panel>

        <Panel
          title="Knowledge by visibility"
          description="Everything the system holds, including what it will never say."
        >
          {Object.keys(data.knowledge.by_visibility).length === 0 ? (
            <EmptyState
              title="No knowledge yet"
              hint="Facts arrive from ingestion and wait for your decision."
            />
          ) : (
            <ul className="space-y-2">
              {Object.entries(data.knowledge.by_visibility).map(([level, count]) => (
                <li key={level} className="flex items-center justify-between gap-3">
                  <VisibilityBadge level={level} />
                  <span className="tabular font-mono text-[var(--text-small)]">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Background work"
          description="Sync and analysis run here, never in a request."
        >
          {Object.keys(data.jobs).length === 0 ? (
            <EmptyState title="Nothing has run yet" />
          ) : (
            <ul className="space-y-2">
              {Object.entries(data.jobs).map(([state, count]) => (
                <li key={state} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.1em] text-ink-muted">
                    {state}
                  </span>
                  <span className="tabular font-mono text-[var(--text-small)]">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--text-small)] text-ink-muted">{label}</dt>
      <dd className="text-[var(--text-small)] font-medium">{value}</dd>
    </div>
  );
}
