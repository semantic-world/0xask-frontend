"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ErrorNotice, Panel, Skeleton } from "@/components/admin/Panel";
import { useSession } from "@/components/admin/SessionProvider";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import type { AdminUserDetail } from "@/lib/admin-types";
import { ApiError, api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

/**
 * Rendered per request.
 *
 * Not for freshness, which the client fetches anyway, but because the content
 * security policy uses a per request nonce and a prerendered page carries none.
 */
export const dynamic = "force-dynamic";

type Problem = { message: string; reasons?: string[] };

function toProblem(caught: unknown, fallback: string): Problem {
  if (caught instanceof ApiError) {
    return { message: caught.message, reasons: caught.reasons };
  }
  return { message: fallback };
}

export default function AccountPage() {
  const { session } = useSession();
  const users = useResource<AdminUserDetail[]>(() => api.get("/api/v1/admin/users"), []);

  return (
    <>
      <PageHeader
        title="Account"
        description="Your password, and who else can reach this console."
      />

      <div className="space-y-4">
        <ChangePassword />

        <Panel
          title="Administrators"
          description="The owner account cannot be removed or deactivated. It is the account that can always recover the console."
          padded={false}
        >
          {users.error ? (
            <div className="p-5">
              <ErrorNotice message={users.error.message} />
            </div>
          ) : users.loading || !users.data ? (
            <Skeleton rows={3} />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {users.data.map((user) => (
                <AdminRow
                  key={user.id}
                  user={user}
                  canManage={Boolean(session?.user.is_owner) || user.is_self}
                  onChanged={users.reload}
                />
              ))}
            </ul>
          )}
        </Panel>

        <AddAdministrator onCreated={users.reload} />
      </div>
    </>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setProblem(null);
    setDone(false);

    if (next !== confirm) {
      setProblem({ message: "Those two passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/v1/admin/auth/password", {
        current_password: current,
        new_password: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (caught) {
      setProblem(toProblem(caught, "Could not change the password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Your password"
      description="Every other session signs out. If the old password was known to anyone else, leaving their session alive would achieve nothing."
    >
      <form onSubmit={submit} className="max-w-md space-y-4">
        {problem ? <ErrorNotice message={problem.message} reasons={problem.reasons} /> : null}
        {done ? (
          <p className="rounded-[var(--radius)] border border-positive/35 bg-positive/5 px-4 py-3 text-[var(--text-small)] text-positive">
            Password changed. Other sessions have been ended.
          </p>
        ) : null}

        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 12 characters. Length is what matters."
          required
          value={next}
          onChange={(event) => setNext(event.target.value)}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <Button type="submit" variant="primary" busy={busy}>
          Change password
        </Button>
      </form>
    </Panel>
  );
}

function AdminRow({
  user,
  canManage,
  onChanged,
}: {
  user: AdminUserDetail;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setProblem(null);
    try {
      await action();
      onChanged();
    } catch (caught) {
      setProblem(toProblem(caught, "That did not work.").message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{user.name}</p>
          {user.is_owner ? <Badge tone="accent">owner</Badge> : null}
          {user.is_self ? <Badge>you</Badge> : null}
          {!user.is_active ? <Badge tone="critical">deactivated</Badge> : null}
          {user.locked_until ? <Badge tone="caution">locked</Badge> : null}
        </div>
        <p className="mt-0.5 truncate font-mono text-[var(--text-caption)] text-ink-faint">
          {user.email}
        </p>
        <p className="mt-1 text-[var(--text-caption)] text-ink-faint">
          Last signed in {formatRelative(user.last_login_at)}
        </p>
        {problem ? (
          <p className="mt-2 text-[var(--text-caption)] text-critical">{problem}</p>
        ) : null}
      </div>

      {canManage ? (
        <div className="flex flex-wrap gap-2">
          {user.locked_until ? (
            <Button
              size="sm"
              busy={busy}
              onClick={() => void run(() => api.post(`/api/v1/admin/users/${user.id}/unlock`))}
            >
              Unlock
            </Button>
          ) : null}

          {!user.is_owner && !user.is_self ? (
            <>
              <Button
                size="sm"
                busy={busy}
                onClick={() =>
                  void run(() =>
                    api.patch(`/api/v1/admin/users/${user.id}`, {
                      is_active: !user.is_active,
                    }),
                  )
                }
              >
                {user.is_active ? "Deactivate" : "Reactivate"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                busy={busy}
                onClick={() => {
                  if (!window.confirm(`Remove ${user.email}? This cannot be undone.`)) return;
                  void run(() => api.delete(`/api/v1/admin/users/${user.id}`));
                }}
              >
                Remove
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function AddAdministrator({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);

    try {
      await api.post("/api/v1/admin/users", { email, name, password });
      setEmail("");
      setName("");
      setPassword("");
      setOpen(false);
      onCreated();
    } catch (caught) {
      setProblem(toProblem(caught, "Could not add that administrator."));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Panel>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Add an administrator
        </Button>
        <p className="mt-2 text-[var(--text-caption)] text-ink-faint">
          They get full access to this console, including what the site says.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Add an administrator"
      description="Full access to this console. They can publish, approve knowledge, and change what the site says."
    >
      <form onSubmit={submit} className="max-w-md space-y-4">
        {problem ? <ErrorNotice message={problem.message} reasons={problem.reasons} /> : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="off"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 12 characters. They can change it once they sign in."
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="flex gap-2">
          <Button type="submit" variant="primary" busy={busy}>
            Add
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
