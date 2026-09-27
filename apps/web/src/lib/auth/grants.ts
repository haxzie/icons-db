import type { Env } from "@/lib/env";
import { getEnv } from "@/lib/env";

export type AppGrant = {
  consentId: string;
  clientId: string;
  appName: string;
  scopes: string[];
  grantedAt: number | null;
  requests: number;
  lastUsedAt: number | null;
};

/** Apps this user has authorized, with how much they've actually been used. */
export async function listGrants(userId: string): Promise<AppGrant[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    `SELECT c.id            AS consent_id,
            c."clientId"    AS client_id,
            c.scopes        AS scopes,
            c."createdAt"   AS granted_at,
            cl.name         AS app_name,
            COALESCE(SUM(u.requests), 0) AS requests,
            MAX(u.last_seen_at)          AS last_used_at
       FROM "oauthConsent" c
       LEFT JOIN "oauthClient" cl ON cl."clientId" = c."clientId"
       LEFT JOIN mcp_usage u ON u.user_id = c."userId" AND u.client_id = c."clientId"
      WHERE c."userId" = ?1
      GROUP BY c.id
      ORDER BY c."createdAt" DESC`,
  )
    .bind(userId)
    .all<{
      consent_id: string;
      client_id: string;
      scopes: string | null;
      granted_at: string | number | null;
      app_name: string | null;
      requests: number;
      last_used_at: number | null;
    }>();

  return results.map((r) => ({
    consentId: r.consent_id,
    clientId: r.client_id,
    appName: r.app_name?.trim() || "Unnamed app",
    scopes: parseScopes(r.scopes),
    grantedAt: toMillis(r.granted_at),
    requests: r.requests ?? 0,
    lastUsedAt: r.last_used_at,
  }));
}

/**
 * Revoke an app.
 *
 * Better Auth's own delete-consent endpoint only removes the consent row, which
 * would leave the app's refresh token working — so this clears the issued tokens
 * too. Access tokens are self-contained JWTs, so `hasGrant` is what actually
 * stops an in-flight one (see the MCP route).
 */
export async function revokeGrant(userId: string, consentId: string): Promise<void> {
  const { DB } = await getEnv();
  const consent = await DB.prepare('SELECT "clientId" FROM "oauthConsent" WHERE id = ?1 AND "userId" = ?2')
    .bind(consentId, userId)
    .first<{ clientId: string }>();
  if (!consent) return;

  await DB.batch([
    DB.prepare('DELETE FROM "oauthAccessToken" WHERE "userId" = ?1 AND "clientId" = ?2').bind(userId, consent.clientId),
    DB.prepare('DELETE FROM "oauthRefreshToken" WHERE "userId" = ?1 AND "clientId" = ?2').bind(userId, consent.clientId),
    DB.prepare('DELETE FROM "oauthConsent" WHERE id = ?1 AND "userId" = ?2').bind(consentId, userId),
  ]);
}

/** Does this user still allow this client? False the moment they revoke. */
export async function hasGrant(env: Env, userId: string, clientId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    'SELECT 1 AS ok FROM "oauthConsent" WHERE "userId" = ?1 AND "clientId" = ?2 LIMIT 1',
  )
    .bind(userId, clientId)
    .first<{ ok: number }>();
  return !!row;
}

function parseScopes(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Stored as a space- or comma-separated string in some versions.
  }
  return value.split(/[\s,]+/).filter(Boolean);
}

function toMillis(value: string | number | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}
