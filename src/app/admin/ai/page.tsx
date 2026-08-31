"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ErrorNotice, Panel, RefreshBar, Skeleton } from "@/components/admin/Panel";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextField } from "@/components/primitives/Field";
import type { ProviderCheck, ProviderStatus, Setting } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

/**
 * Everything about the model provider, in one place that can prove itself.
 *
 * This existed only as three text fields on the settings page named after
 * their storage keys, which is how a key could sit in the environment, be
 * read correctly, and still produce no answers with nothing anywhere saying
 * why. Configuration that cannot be tested is configuration the owner has to
 * debug from the outside.
 */

export default function AiPage() {
  const status = useResource<ProviderStatus>(() => api.get("/api/v1/admin/ai"), []);
  const settings = useResource<Setting[]>(() => api.get("/api/v1/admin/settings"), []);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [check, setCheck] = useState<ProviderCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [key, setKey] = useState("");
  const [keyFor, setKeyFor] = useState("openai");

  if (status.error && !status.data) return <ErrorNotice message={status.error.message} />;
  if (!status.data || !settings.data) return <Skeleton rows={6} />;

  const byKey = new Map(settings.data.map((setting) => [setting.key, setting]));
  const dirty = Object.keys(draft).length > 0;

  function value(name: string): string {
    if (name in draft) return draft[name] ?? "";
    return String(byKey.get(name)?.value.value ?? "");
  }

  function set(name: string, next: string) {
    setDraft((current) => ({ ...current, [name]: next }));
    setCheck(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.patch("/api/v1/admin/settings", { values: draft });
      setDraft({});
      settings.reload();
      status.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setTesting(true);
    setError(null);
    setCheck(null);
    try {
      setCheck(await api.post<ProviderCheck>("/api/v1/admin/ai/test", {}));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the provider.");
    } finally {
      setTesting(false);
    }
  }

  async function storeKey() {
    if (!key.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.put("/api/v1/admin/ai/key", { provider: keyFor, api_key: key.trim() });
      setKey("");
      status.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not store that key.");
    } finally {
      setBusy(false);
    }
  }

  async function reindex() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/v1/admin/jobs/knowledge.embed", {});
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not queue that.");
    } finally {
      setBusy(false);
    }
  }

  const live = status.data;
  const chatProvider = value("ai.provider") || "local";
  const embedProvider = value("ai.embedding_provider") || chatProvider;

  return (
    <>
      <PageHeader
        title="Model provider"
        description="Which model writes the answers, which one makes the vectors, and whether either of them actually works."
        action={
          <Button variant="secondary" busy={testing} onClick={() => void test()}>
            Test connection
          </Button>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      {check ? (
        <div className="mb-4">
          <Panel title="Test result">
            <ul className="space-y-3">
              <Result
                label="Writing answers"
                ok={check.generation_ok}
                detail={check.generation_error}
              />
              <Result
                label="Making vectors"
                ok={check.embedding_ok}
                detail={check.embedding_error}
              />
            </ul>
            {check.generation_ok && check.embedding_ok ? (
              <p className="mt-4 text-[var(--text-small)] text-ink-muted">
                Both work. 0xAsk will write answers from the approved knowledge and cite it.
              </p>
            ) : null}
          </Panel>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Current"
          description="What the system is using right now, after the console and the environment have both had their say."
        >
          <RefreshBar active={status.refreshing} />
          <dl className="space-y-3">
            <Row label="Writes answers with" value={live.selected} />
            <Row label="Chat model" value={live.chat_model ?? "the provider's default"} />
            <Row
              label="Makes vectors with"
              value={`${live.embedding_model ?? "unknown"} (${live.embedding_dimensions})`}
            />
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[var(--text-small)] text-ink-muted">Can write prose</dt>
              <dd>
                <Badge tone={live.can_generate ? "positive" : "caution"}>
                  {live.can_generate ? "yes" : "evidence only"}
                </Badge>
              </dd>
            </div>
          </dl>

          {!live.can_generate ? (
            <p className="mt-4 text-[var(--text-small)] text-ink-muted">
              0xAsk still answers. It returns the approved claims and their sources rather than
              writing prose over them, which is the honest failure and not an outage.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Keys"
          description="Stored encrypted and never returned. A key in the console beats one in the environment, because it is the more recent decision."
        >
          <dl className="space-y-3">
            {live.known
              .filter((name) => name !== "local")
              .map((name) => (
                <div key={name} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[var(--text-small)] text-ink-muted">{name}</dt>
                  <dd className="text-right">
                    {live.keys[name] ? (
                      <>
                        <span className="font-mono text-[var(--text-caption)]">
                          {live.keys[name]}
                        </span>
                        <span className="ml-2 text-[var(--text-caption)] text-ink-faint">
                          from the {live.source[name]}
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--text-caption)] text-ink-faint">none</span>
                    )}
                  </dd>
                </div>
              ))}
          </dl>

          <div className="mt-5 space-y-3 border-t border-border-subtle pt-4">
            <SelectField
              label="Store a key for"
              value={keyFor}
              onChange={setKeyFor}
              options={live.known
                .filter((name) => name !== "local")
                .map((name) => ({ value: name, label: name }))}
            />
            <TextField
              label="API key"
              type="password"
              hint="Checked and encrypted on save. It is never shown again."
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
            <Button variant="secondary" busy={busy} onClick={() => void storeKey()}>
              Store key
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Configuration"
          description="The console wins over the environment. Leave a field empty to fall back to what the deployment was built with."
          action={
            dirty ? (
              <Button variant="primary" busy={busy} onClick={() => void save()}>
                Save
              </Button>
            ) : null
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Provider"
              hint="Which provider writes the answers."
              value={value("ai.provider")}
              onChange={(next) => set("ai.provider", next)}
              options={[
                { value: "", label: "Use the environment" },
                ...live.known.map((name) => ({ value: name, label: name })),
              ]}
            />
            <TextField
              label="Chat model"
              hint="Empty takes the provider's default."
              placeholder="gpt-4o"
              value={value("ai.chat_model")}
              onChange={(event) => set("ai.chat_model", event.target.value)}
            />
            <SelectField
              label="Embedding provider"
              hint="Only set this when one key can write but not embed."
              value={value("ai.embedding_provider")}
              onChange={(next) => set("ai.embedding_provider", next)}
              options={[
                { value: "", label: "Same as the provider" },
                ...live.known.map((name) => ({ value: name, label: name })),
              ]}
            />
            <TextField
              label="Embedding model"
              hint="Changing this invalidates every stored vector. Re-embed after."
              placeholder="text-embedding-3-small"
              value={value("ai.embedding_model")}
              onChange={(event) => set("ai.embedding_model", event.target.value)}
            />
          </div>

          {chatProvider !== embedProvider ? (
            <p className="mt-5 text-[var(--text-small)] text-ink-muted">
              Split: <span className="text-ink">{chatProvider}</span> writes the answers and{" "}
              <span className="text-ink">{embedProvider}</span> makes the vectors. That is the right
              shape when one key has access to a chat model and not to an embedding model, because
              otherwise a failing embedding call takes retrieval down alongside generation.
            </p>
          ) : null}

          <div className="mt-6 border-t border-border-subtle pt-4">
            <p className="text-[var(--text-small)] text-ink-muted">
              Changing the embedding provider or model leaves every stored vector made by the old
              one. They are replaced in the background, but only once something asks.
            </p>
            <div className="mt-3">
              <Button variant="secondary" busy={busy} onClick={() => void reindex()}>
                Re-embed knowledge
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--text-small)] text-ink-muted">{label}</dt>
      <dd className="truncate text-right font-mono text-[var(--text-caption)]">{value}</dd>
    </div>
  );
}

function Result({ label, ok, detail }: { label: string; ok: boolean; detail: string | null }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[var(--text-small)]">{label}</span>
        <Badge tone={ok ? "positive" : "critical"}>{ok ? "works" : "fails"}</Badge>
      </div>
      {detail ? <p className="mt-1.5 text-[var(--text-caption)] text-ink-faint">{detail}</p> : null}
    </li>
  );
}
