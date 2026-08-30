"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { Button } from "@/components/primitives/Button";
import { TextField, Toggle } from "@/components/primitives/Field";
import type { Setting } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

type Group = {
  title: string;
  description: string;
  keys: string[];
};

const GROUPS: Group[] = [
  {
    title: "Public surface",
    description:
      "Both are off until you turn them on. Turning the site off takes it down immediately.",
    keys: ["site.published", "ask.enabled"],
  },
  {
    title: "0xAsk",
    description:
      "Message content is not stored by default. Turning retention on changes what this system keeps about the people who visit it.",
    keys: ["ask.cache_ttl_seconds", "ask.retain_message_content", "ask.retention_days"],
  },
  {
    title: "Ingestion",
    description: "How often the system looks at GitHub. Manual syncs are always available.",
    keys: ["github.sync_interval_days"],
  },
  {
    title: "AI provider",
    description:
      "Selected here rather than hard coded. Changing the embedding model needs the stored dimension to match.",
    keys: ["ai.provider", "ai.embedding_model"],
  },
];

export default function SettingsPage() {
  const settings = useResource<Setting[]>(() => api.get("/api/v1/admin/settings"), []);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<{ message: string; reasons?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (settings.error) return <ErrorNotice message={settings.error.message} />;
  if (settings.loading || !settings.data) return <Skeleton rows={6} />;

  const byKey = new Map(settings.data.map((setting) => [setting.key, setting]));
  const dirty = Object.keys(draft).length > 0;

  function value(key: string): unknown {
    if (key in draft) return draft[key];
    return byKey.get(key)?.value.value;
  }

  function set(key: string, next: unknown) {
    setDraft((current) => ({ ...current, [key]: next }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.patch("/api/v1/admin/settings", { values: draft });
      setDraft({});
      setSaved(true);
      settings.reload();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? { message: caught.message, reasons: caught.reasons }
          : { message: "Could not save." },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="How the system behaves at run time." />

      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error.message} reasons={error.reasons} />
        </div>
      ) : null}

      <div className="space-y-4">
        {GROUPS.map((group) => (
          <Panel key={group.title} title={group.title} description={group.description}>
            <div className="divide-y divide-border-subtle">
              {group.keys.map((key) => {
                const setting = byKey.get(key);
                if (!setting) return null;
                const current = value(key);

                if (typeof current === "boolean") {
                  return (
                    <Toggle
                      key={key}
                      label={key}
                      hint={setting.description ?? undefined}
                      checked={current}
                      onChange={(next) => set(key, next)}
                    />
                  );
                }

                return (
                  <div key={key} className="py-3">
                    <TextField
                      label={key}
                      hint={setting.description ?? undefined}
                      type={typeof current === "number" ? "number" : "text"}
                      value={current === null || current === undefined ? "" : String(current)}
                      onChange={(event) =>
                        set(
                          key,
                          typeof current === "number"
                            ? Number(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>

      <div className="sticky bottom-0 z-30 mt-6 flex items-center justify-between gap-3 border-t border-border-subtle bg-paper/90 px-1 py-3 pad-safe-bottom backdrop-blur-xl">
        <p className="text-[var(--text-caption)] text-ink-faint">
          {dirty ? "Unsaved changes" : saved ? "Saved" : "No changes"}
        </p>
        <Button variant="primary" busy={busy} disabled={!dirty} onClick={() => void save()}>
          Save settings
        </Button>
      </div>
    </>
  );
}
