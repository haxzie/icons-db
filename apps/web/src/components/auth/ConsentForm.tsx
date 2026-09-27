"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ConsentForm({ clientName }: { clientName: string }) {
  const [busy, setBusy] = useState<"accept" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(accept: boolean) {
    setBusy(accept ? "accept" : "deny");
    setError(null);
    // oauthProviderClient attaches the signed oauth_query from the URL.
    const { data, error } = await authClient.oauth2.consent({ accept });
    if (error || !data?.url) {
      setBusy(null);
      setError(error?.message ?? "Couldn't complete the authorization. Try again.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => decide(true)}
        className="h-12 rounded-full bg-accent px-5 text-base font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {busy === "accept" ? "Authorizing…" : `Allow ${clientName}`}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => decide(false)}
        className="h-12 rounded-full border border-line px-5 text-base font-medium transition hover:bg-bg-muted disabled:opacity-60"
      >
        Cancel
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
