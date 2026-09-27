"use client";

import { useState, useTransition } from "react";
import type { ApiToken } from "@/lib/auth/tokens";
import { createTokenAction, deleteTokenAction } from "@/app/profile/actions";
import { formatWhen } from "./format";

export function TokenManager({ tokens }: { tokens: ApiToken[] }) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTokenAction(name);
      if (result.error) return setError(result.error);
      setCreated(result.token ?? null);
      setName("");
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const { error } = await deleteTokenAction(id);
      if (error) setError(error);
      setConfirming(null);
    });
  }

  return (
    <>
      {created && <NewToken token={created} onDismiss={() => setCreated(null)} />}

      <form onSubmit={create} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name, e.g. Laptop CLI"
          maxLength={60}
          className="h-11 min-w-0 flex-1 rounded-full bg-bg-muted px-4 text-sm outline-none placeholder:text-fg-subtle focus:bg-bg-elevated focus:ring-1 focus:ring-line"
        />
        <button
          type="submit"
          disabled={pending || name.trim().length === 0}
          className="h-11 shrink-0 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create token"}
        </button>
      </form>

      {tokens.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center gap-4 rounded-2xl border border-line p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{token.name}</p>
                <p className="mt-0.5 font-mono text-xs text-fg-muted">{token.hint}…</p>
                <p className="mt-0.5 text-xs text-fg-subtle">
                  Created {formatWhen(token.createdAt)} ·{" "}
                  {token.lastUsedAt ? `last used ${formatWhen(token.lastUsedAt)}` : "never used"}
                </p>
              </div>
              {confirming === token.id ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(token.id)}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Deleting…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(token.id)}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-red-600 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}

/** Shown once — the plaintext is never stored, so there's no second chance. */
function NewToken({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border border-accent bg-accent-soft p-4">
      <p className="text-sm font-medium">Copy your token now — it won&apos;t be shown again.</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-bg px-3 py-2 font-mono text-xs">{token}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(token).then(() => setCopied(true));
          }}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full border border-line px-3 py-2 text-sm hover:bg-bg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
