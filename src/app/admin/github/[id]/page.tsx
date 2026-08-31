"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import {
  EmptyState,
  ErrorNotice,
  Metric,
  Panel,
  RefreshBar,
  Skeleton,
} from "@/components/admin/Panel";
import { Badge, VisibilityBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import type { RepositoryDetail } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

/**
 * One repository, and what has actually come out of it.
 *
 * Allowing a repository starts a pipeline and the console showed none of it,
 * so the owner allowed forty nine of them and had no way to find out that
 * nothing had been read from any. This is the page behind the row: what was
 * collected, what was turned into claims, what is still waiting on a
 * decision, and a way to run the work rather than wait thirty days for it.
 */
export default function RepositoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const resource = useResource<RepositoryDetail>(
    () => api.get(`/api/v1/admin/github/repositories/${params.id}`),
    [params.id],
  );

  async function run(kind: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      await api.post(`/api/v1/admin/jobs/${kind}`, {});
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : `Could not queue ${label}.`);
    } finally {
      setBusy(null);
    }
  }

  async function setDisclosure(allowed: boolean) {
    setBusy("disclosure");
    setError(null);
    resource.mutate((current) => ({ ...current, disclosure_allowed: allowed }));
    try {
      await api.patch(`/api/v1/admin/github/repositories/${params.id}`, {
        disclosure_allowed: allowed,
      });
    } catch (caught) {
      resource.mutate((current) => ({ ...current, disclosure_allowed: !allowed }));
      setError(caught instanceof ApiError ? caught.message : "Could not change that.");
    } finally {
      setBusy(null);
    }
  }

  if (resource.error && !resource.data) return <ErrorNotice message={resource.error.message} />;
  if (!resource.data) return <Skeleton rows={8} />;

  const repository = resource.data;
  const isPublic = repository.visibility === "PUBLIC";
  const collected = repository.sources_collected > 0;

  return (
    <>
      <PageHeader
        title={repository.full_name}
        description={repository.description ?? "No description on GitHub."}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push("/admin/github")}>
              Back
            </Button>
            {isPublic ? (
              <Button
                variant={repository.disclosure_allowed ? "primary" : "secondary"}
                busy={busy === "disclosure"}
                onClick={() => void setDisclosure(!repository.disclosure_allowed)}
              >
                {repository.disclosure_allowed ? "Allowed" : "Not allowed"}
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sources collected" value={repository.sources_collected} />
        <Metric
          label="Claims extracted"
          value={repository.knowledge_items}
          hint={`${repository.knowledge_approved} approved`}
        />
        <Metric label="Awaiting review" value={repository.knowledge_pending} />
        <Metric
          label="Secrets removed"
          value={repository.secrets_detected}
          hint="Before anything was stored"
        />
      </div>

      {/* The whole point of the page: say where this repository has got to,
          in a sentence, rather than leaving four numbers to be interpreted. */}
      <div className="mt-4">
        <Panel title="Where this has got to">
          <RefreshBar active={resource.refreshing} />
          <p className="text-ink-muted">{explain(repository)}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              busy={busy === "sync"}
              onClick={() => void run("github.sync", "sync")}
            >
              Sync from GitHub
            </Button>
            <Button
              variant="secondary"
              busy={busy === "extract"}
              onClick={() => void run("knowledge.extract", "extract")}
            >
              Extract knowledge
            </Button>
            {repository.knowledge_pending > 0 ? (
              <Link href="/admin/review">
                <Button variant="primary">Review {repository.knowledge_pending} claim(s)</Button>
              </Link>
            ) : null}
            {repository.knowledge_items > 0 ? (
              <Link href={`/admin/knowledge?subject_type=REPOSITORY&subject_id=${repository.id}`}>
                <Button variant="ghost">See the claims</Button>
              </Link>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="On GitHub">
          <dl className="space-y-3">
            <Row label="Visibility">
              <VisibilityBadge level={repository.visibility} />
            </Row>
            <Row label="Language">{repository.primary_language ?? "unknown"}</Row>
            <Row label="Stars">{String(repository.stars)}</Row>
            <Row label="Last push">{formatRelative(repository.pushed_at)}</Row>
            <Row label="Last synced">{formatDateTime(repository.last_synced_at)}</Row>
            <Row label="At commit">
              <span className="font-mono text-[var(--text-caption)]">
                {repository.last_synced_commit?.slice(0, 10) ?? "never"}
              </span>
            </Row>
            {repository.is_fork ? (
              <Row label="Fork">
                <Badge tone="caution">fork</Badge>
              </Row>
            ) : null}
            {repository.is_archived ? (
              <Row label="Archived">
                <Badge tone="caution">archived</Badge>
              </Row>
            ) : null}
          </dl>

          {repository.html_url ? (
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[var(--text-small)] text-accent hover:underline"
            >
              Open on GitHub <span aria-hidden="true">&#8599;</span>
            </a>
          ) : null}

          {repository.topics.length ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {repository.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint"
                >
                  {topic}
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel
          title="What was read"
          description="Only ever read from a public repository the owner cleared. A private one contributes its existence and nothing else."
          padded={false}
        >
          {!collected ? (
            <div className="p-5">
              <EmptyState
                title="Nothing collected yet"
                hint={
                  isPublic
                    ? repository.disclosure_allowed
                      ? "Allowed, but no sync has read it yet. Sync from GitHub above."
                      : "Allow this repository, and a sync is queued for you."
                    : "Private. Its content is never read, by design."
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {repository.sources.map((source) => (
                <li key={source.id} className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[var(--text-small)]">{source.title}</p>
                    <p className="font-mono text-[var(--text-caption)] text-ink-faint">
                      {source.kind.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  {source.was_redacted ? <Badge tone="caution">redacted</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--text-small)] text-ink-muted">{label}</dt>
      <dd className="text-right text-[var(--text-small)]">{children}</dd>
    </div>
  );
}

/** The state of this repository, said in a sentence rather than left implied. */
function explain(repository: RepositoryDetail): string {
  if (repository.visibility !== "PUBLIC") {
    return "Private, so its contents are never read. It appears here because the owner needs to know what exists; nothing about it can reach the public surface.";
  }
  if (!repository.disclosure_allowed) {
    return "Not cleared for disclosure, so nothing has been read from it. Allowing it queues a sync, and the sync queues extraction.";
  }
  if (repository.sources_collected === 0) {
    return "Cleared, but no sync has read it yet. Content is only ever collected during a sync, so run one and the rest follows.";
  }
  if (repository.knowledge_items === 0) {
    return `${repository.sources_collected} source(s) collected, but nothing has been turned into claims yet. Extraction is what does that.`;
  }
  if (repository.knowledge_pending > 0) {
    return `${repository.knowledge_items} claim(s) extracted, ${repository.knowledge_pending} of them still pending. Nothing pending has been seen by a visitor; approving is the only thing that changes that.`;
  }
  return `${repository.knowledge_items} claim(s) extracted and all of them decided. ${repository.knowledge_approved} approved and reachable by 0xAsk.`;
}
