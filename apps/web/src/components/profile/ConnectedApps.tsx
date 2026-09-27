"use client";

import { useState, useTransition } from "react";
import type { AppGrant } from "@/lib/auth/grants";
import { revokeGrantAction } from "@/app/profile/actions";
import { formatWhen } from "./format";

export function ConnectedApps({ grants }: { grants: AppGrant[] }) {
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (grants.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">
        No apps yet. Point your coding agent at the MCP endpoint and it&apos;ll ask for access.
      </p>
    );
  }

  function revoke(consentId: string) {
    setError(null);
    startTransition(async () => {
      const { error } = await revokeGrantAction(consentId);
      if (error) setError(error);
      setConfirming(null);
    });
  }

  return (
    <>
      <ul className="mt-4 flex flex-col gap-2">
        {grants.map((grant) => (
          <li key={grant.consentId} className="flex items-center gap-4 rounded-2xl border border-line p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{grant.appName}</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                Authorized {formatWhen(grant.grantedAt)}
                {grant.requests > 0 && ` · ${grant.requests.toLocaleString()} request${grant.requests === 1 ? "" : "s"}`}
                {grant.lastUsedAt && ` · last used ${formatWhen(grant.lastUsedAt)}`}
              </p>
            </div>
            {confirming === grant.consentId ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => revoke(grant.consentId)}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Revoking…" : "Confirm"}
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
                onClick={() => setConfirming(grant.consentId)}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-red-600 hover:text-red-600"
              >
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
