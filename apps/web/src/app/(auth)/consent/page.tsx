import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ConsentCards } from "@/components/auth/ConsentCards";
import { ConsentForm } from "@/components/auth/ConsentForm";
import { Avatar } from "@/components/auth/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorize",
  robots: { index: false, follow: false },
};

const SCOPE_LABELS: Record<string, string> = {
  openid: "Confirm who you are",
  profile: "Read your name and profile picture",
  email: "Read your email address",
  offline_access: "Stay connected without asking you again",
  "mcp:icons": "Search IconsDB and fetch icon code on your behalf",
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : [])),
  );

  const session = await getSession(await headers());
  if (!session) redirect(`/sign-in?${query.toString()}`);

  // The authorization request is signed, and /oauth2/consent re-verifies that
  // signature before granting anything — a tampered URL can never produce a
  // token. What this page must not do is put a name the caller invented on
  // screen, so the client is resolved from our own records or not shown at all.
  const client = await lookupClient(query.get("client_id") ?? "");
  if (!client) {
    return <Problem title="This authorization link isn't valid" body="It may have expired, or the application isn't registered. Start the connection again from your MCP client." />;
  }

  const scopes = (query.get("scope") ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <ConsentCards clientName={client.name} logoUrl={client.icon} />
        <h1 className="text-2xl font-medium tracking-tight">Authorize {client.name}</h1>
        <p className="text-sm text-fg-muted">
          It wants to use the IconsDB MCP server as{" "}
          <span className="text-fg">{session.user.name}</span> ({session.user.email}).
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-bg-muted p-4">
        <Avatar src={session.user.image} name={session.user.name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-fg-muted">{session.user.email}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 rounded-2xl border border-line p-4">
        {scopes.map((scope) => (
          <li key={scope} className="flex gap-3 text-sm">
            <span aria-hidden className="mt-0.5 text-accent">✓</span>
            <span>{SCOPE_LABELS[scope] ?? scope}</span>
          </li>
        ))}
      </ul>

      <ConsentForm clientName={client.name} />

      <p className="text-center text-xs text-fg-subtle">
        You can revoke this access at any time from your IconsDB account.
      </p>
    </main>
  );
}

async function lookupClient(
  clientId: string,
): Promise<{ name: string; uri: string | null; icon: string | null } | null> {
  if (!clientId) return null;
  const { DB } = await getEnv();
  const row = await DB.prepare('SELECT name, uri, icon FROM "oauthClient" WHERE "clientId" = ?1 AND ("disabled" IS NULL OR "disabled" = 0)')
    .bind(clientId)
    .first<{ name: string | null; uri: string | null; icon: string | null }>();
  if (!row) return null;
  return {
    name: row.name?.trim() || "an unnamed application",
    uri: row.uri,
    icon: httpUrl(row.icon),
  };
}

/** Only http(s) survives — `data:`/`javascript:` logos never reach the page. */
function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-medium">{title}</h1>
      <p className="text-sm text-fg-muted">{body}</p>
    </main>
  );
}
