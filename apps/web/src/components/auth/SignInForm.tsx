"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

export function SignInForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const { error } = await authClient.signIn.magicLink({ email, callbackURL });
    setStatus(
      error
        ? { kind: "error", message: error.message ?? "Couldn't send the link. Try again." }
        : { kind: "sent" },
    );
  }

  if (status.kind === "sent") {
    return (
      <div className="rounded-2xl bg-bg-muted p-6 text-center">
        <h2 className="text-lg font-medium">Check your inbox</h2>
        <p className="mt-2 text-sm text-fg-muted">
          We sent a sign-in link to <span className="text-fg">{email}</span>. It expires in 10 minutes.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SocialButton
        provider="github"
        label="Continue with GitHub"
        callbackURL={callbackURL}
        icon={
          <svg viewBox="0 0 16 16" className="size-5" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        }
      />
      <SocialButton
        provider="google"
        label="Continue with Google"
        callbackURL={callbackURL}
        icon={
          <svg viewBox="0 0 18 18" className="size-5" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18" />
            <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.17 6.66 3.58 9 3.58" />
          </svg>
        }
      />

      <div className="flex items-center gap-3 text-xs text-fg-subtle">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-full bg-bg-muted px-5 text-base outline-none placeholder:text-fg-subtle focus:bg-bg-elevated focus:ring-1 focus:ring-line"
        />
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="h-12 rounded-full bg-accent px-5 text-base font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}

      <p className="text-center text-xs text-fg-subtle">
        New here? The link signs you up — no separate account creation.
      </p>
    </div>
  );
}

function SocialButton({
  provider,
  label,
  icon,
  callbackURL,
}: {
  provider: "github" | "google";
  label: string;
  icon: React.ReactNode;
  callbackURL: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        authClient.signIn.social({ provider, callbackURL });
      }}
      className="flex h-12 items-center justify-center gap-3 rounded-full border border-line bg-bg px-5 text-base font-medium transition hover:bg-bg-muted disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}
