"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        signOut().then(() => {
          router.push("/");
          // The profile page is force-dynamic; refresh drops its cached session.
          router.refresh();
        });
      }}
      className="shrink-0 rounded-full border border-line px-4 py-2 text-sm transition hover:bg-bg-muted disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
