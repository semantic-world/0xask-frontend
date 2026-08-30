"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { Badge, VisibilityBadge } from "@/components/primitives/Badge";
import { Toggle } from "@/components/primitives/Field";
import type { Policy } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const DECISION_TONE = {
  BLOCK: "critical",
  RESTRICT: "caution",
  ALLOW: "positive",
} as const;

export default function PoliciesPage() {
  const policies = useResource<Policy[]>(() => api.get("/api/v1/admin/policies"), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(policy: Policy, active: boolean) {
    setPending(policy.id);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/policies/${policy.id}`, { is_active: active });
      policies.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not change that policy.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Policies"
        description="What the system is allowed to disclose. These constrain what can be retrieved before a model is involved, not after."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      {policies.error ? (
        <ErrorNotice message={policies.error.message} />
      ) : policies.loading || !policies.data ? (
        <Skeleton rows={4} />
      ) : (
        <div className="space-y-3">
          {policies.data.map((policy) => (
            <Panel key={policy.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[length:var(--text-h4)] font-medium">{policy.label}</h3>
                    <Badge tone={DECISION_TONE[policy.decision]}>{policy.decision}</Badge>
                    {policy.is_system ? <Badge>system</Badge> : null}
                    {policy.default_visibility ? (
                      <VisibilityBadge level={policy.default_visibility} />
                    ) : null}
                  </div>
                  {policy.description ? (
                    <p className="mt-2 max-w-[70ch] text-[var(--text-small)] text-ink-muted">
                      {policy.description}
                    </p>
                  ) : null}
                  {Array.isArray(policy.conditions.terms) ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(policy.conditions.terms as string[]).map((term) => (
                        <span
                          key={term}
                          className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[0.6875rem] text-ink-faint"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 font-mono text-[var(--text-caption)] text-ink-faint">
                    {policy.key} · priority {policy.priority} · scope {policy.scope.toLowerCase()}
                  </p>
                </div>

                <div className="w-full max-w-[15rem]">
                  <Toggle
                    label="Active"
                    hint={
                      policy.is_system
                        ? "A system policy. It cannot be deleted, only turned off."
                        : undefined
                    }
                    checked={policy.is_active}
                    disabled={pending === policy.id}
                    onChange={(next) => void toggle(policy, next)}
                  />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
