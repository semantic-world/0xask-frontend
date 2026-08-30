"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/admin/Panel";
import { useSession } from "@/components/admin/SessionProvider";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { ApiError, api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post("/api/v1/admin/auth/login", { email, password });
      await refresh();
      router.replace("/admin");
    } catch (caught) {
      // The server refuses a wrong password and an unknown address
      // identically, and this message does not undo that.
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-[0.95rem] font-semibold">
            <span className="text-accent">0x</span>Ask
          </p>
          <h1 className="mt-4 text-[length:var(--text-h3)] font-medium">Control room</h1>
          <p className="mt-1.5 text-[var(--text-small)] text-ink-muted">
            Sign in to manage what this system knows and what it may say.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error ? <ErrorNotice message={error} /> : null}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" variant="primary" busy={busy} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
