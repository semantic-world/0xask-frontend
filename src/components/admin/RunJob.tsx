"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ApiError, api } from "@/lib/api";

/**
 * Queue a background job by hand.
 *
 * Every screen in the console showed the result of work that only ran on a
 * schedule, and none of them offered a way to run it. Waiting thirty days to
 * find out whether a decision had any effect is not a workflow.
 *
 * The job is queued, not run: the answer arrives when the runner picks it up,
 * so the button reports that it was queued rather than pretending to have
 * finished something.
 */
export function RunJob({
  kind,
  label,
  hint,
  variant = "secondary",
  onQueued,
}: {
  kind: string;
  label: string;
  hint?: string;
  variant?: "primary" | "secondary" | "ghost";
  onQueued?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "queued" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/api/v1/admin/jobs/${kind}`, {});
      setState("queued");
      onQueued?.();
    } catch (caught) {
      setState("failed");
      setMessage(caught instanceof ApiError ? caught.message : "Could not queue that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button variant={variant} busy={busy} onClick={() => void run()} title={hint}>
        {state === "queued" ? `${label}, queued` : label}
      </Button>
      {message ? <span className="text-[var(--text-caption)] text-critical">{message}</span> : null}
    </span>
  );
}
