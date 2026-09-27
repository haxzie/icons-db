import { importJWK, jwtVerify, type JWTPayload } from "jose";
import type { Env } from "@/lib/env";

/**
 * Verify an MCP access token against the signing keys in D1.
 *
 * Deliberately *not* `requireMcpAuth`: that only accepts a `jwksUrl`, so it
 * fetches https://iconsdb.app/api/auth/jwks over HTTP. With the
 * `global_fetch_strictly_public` compat flag that request leaves Cloudflare and
 * comes back into this same Worker, and under concurrency those re-entrant
 * invocations pile up until every request to the Worker hangs. The keys are
 * already in our database, so read them instead of asking ourselves over the
 * network.
 */
type StoredKey = { id: string; publicKey: string; alg: string | null };

// Keys rotate rarely; cache per isolate and only re-read when a kid misses.
let cache: { keys: StoredKey[]; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

async function loadKeys(env: Env, force = false): Promise<StoredKey[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.keys;
  const { results } = await env.DB.prepare('SELECT id, "publicKey", alg FROM "jwks"').all<StoredKey>();
  cache = { keys: results, at: Date.now() };
  return results;
}

export type VerifyResult =
  | { ok: true; claims: JWTPayload }
  | { ok: false; error: "invalid_token" | "insufficient_scope"; description: string };

export async function verifyAccessToken(
  env: Env,
  token: string,
  opts: { issuer: string; resource: string; requiredScopes: string[] },
): Promise<VerifyResult> {
  let keys = await loadKeys(env);

  // A token signed by a key minted after this isolate cached is the normal
  // reason for a miss, so re-read once before rejecting it.
  const kid = readKid(token);
  if (kid && !keys.some((k) => k.id === kid)) keys = await loadKeys(env, true);
  if (keys.length === 0) {
    return { ok: false, error: "invalid_token", description: "No signing keys are configured" };
  }

  const candidates = kid ? keys.filter((k) => k.id === kid) : keys;
  for (const stored of candidates.length ? candidates : keys) {
    try {
      const jwk = JSON.parse(stored.publicKey) as Record<string, unknown>;
      const alg = (stored.alg ?? (jwk.crv === "Ed25519" ? "EdDSA" : "ES256")) as string;
      const key = await importJWK(jwk, alg);
      const { payload } = await jwtVerify(token, key, {
        issuer: opts.issuer,
        audience: opts.resource,
        algorithms: [alg],
      });

      const granted = new Set(String(payload.scope ?? "").split(/\s+/).filter(Boolean));
      const missing = opts.requiredScopes.filter((s) => !granted.has(s));
      if (missing.length) {
        return { ok: false, error: "insufficient_scope", description: `Missing scope: ${missing.join(" ")}` };
      }
      return { ok: true, claims: payload };
    } catch {
      // Try the next key; report a generic failure if none verify.
    }
  }

  return { ok: false, error: "invalid_token", description: "Token is expired, malformed or not for this resource" };
}

function readKid(token: string): string | null {
  try {
    const [header] = token.split(".");
    const json = JSON.parse(atob(header.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.kid === "string" ? json.kid : null;
  } catch {
    return null;
  }
}
