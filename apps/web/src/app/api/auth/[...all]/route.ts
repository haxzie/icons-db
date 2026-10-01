import { getAuth } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { withNativeApplicationType } from "@/lib/auth/dcr";
import { parseScopeList, withOfflineAccess } from "@/lib/auth/scopes";

export const dynamic = "force-dynamic";

const REGISTER_PATH = "/api/auth/oauth2/register";
const AUTHORIZE_PATH = "/api/auth/oauth2/authorize";

/** See lib/auth/dcr.ts: relabels loopback-only DCR clients as native. */
async function normalizeRegistration(req: Request): Promise<Request> {
  if (req.method !== "POST" || new URL(req.url).pathname !== REGISTER_PATH) return req;
  if (!req.headers.get("content-type")?.includes("application/json")) return req;

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.clone().text());
  } catch {
    return req;
  }

  const patched = withNativeApplicationType(body);
  return patched ? new Request(req, { body: JSON.stringify(patched) }) : req;
}

/**
 * See lib/auth/scopes.ts: adds offline_access so the client gets a refresh
 * token instead of being signed out when its access token expires.
 *
 * The authorization endpoint takes GET or POST, and the parameters live in the
 * query string either way for GET and in the form body for POST.
 */
async function normalizeAuthorization(req: Request): Promise<Request> {
  const url = new URL(req.url);
  if (url.pathname !== AUTHORIZE_PATH) return req;

  if (req.method === "GET") {
    const scope = await nextScope(url.searchParams);
    if (!scope) return req;
    url.searchParams.set("scope", scope);
    return new Request(url, req);
  }

  if (req.method !== "POST") return req;
  if (!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) return req;
  const form = new URLSearchParams(await req.clone().text());
  const scope = await nextScope(form);
  if (!scope) return req;
  form.set("scope", scope);
  return new Request(req, { body: form.toString() });
}

/**
 * Requesting offline_access makes the provider require PKCE, so only requests
 * that already carry a code_challenge are touched — adding the scope to a
 * PKCE-less request would turn a working authorization into an error.
 */
async function nextScope(params: URLSearchParams): Promise<string | null> {
  if (!params.get("code_challenge")) return null;
  const clientId = params.get("client_id") ?? "";
  if (!clientId) return null;
  return withOfflineAccess(params.get("scope"), await registeredScopes(clientId));
}

/** The scopes this client registered for, from our own records. */
async function registeredScopes(clientId: string): Promise<string[]> {
  const { DB } = await getEnv();
  const row = await DB.prepare('SELECT scopes FROM "oauthClient" WHERE "clientId" = ?1')
    .bind(clientId)
    .first<{ scopes: string | null }>();
  return parseScopeList(row?.scopes ?? null);
}

const handle = async (req: Request) => {
  const normalized = await normalizeAuthorization(await normalizeRegistration(req));
  return (await getAuth()).handler(normalized);
};

export { handle as GET, handle as POST, handle as OPTIONS };
