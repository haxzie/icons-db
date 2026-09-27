import type { Env } from "@/lib/env";
import { getEnv } from "@/lib/env";

/** Recognisable prefix so a leaked token is greppable and obviously ours. */
const PREFIX = "idb_";
const MAX_PER_USER = 20;

export type ApiToken = {
  id: string;
  name: string;
  hint: string;
  createdAt: number;
  lastUsedAt: number | null;
};

export async function listTokens(userId: string): Promise<ApiToken[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    "SELECT id, name, hint, created_at, last_used_at FROM api_token WHERE user_id = ?1 ORDER BY created_at DESC",
  )
    .bind(userId)
    .all<{ id: string; name: string; hint: string; created_at: number; last_used_at: number | null }>();
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    hint: r.hint,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

/**
 * Mint a token. The plaintext is returned once and never stored — only its
 * SHA-256 — so a database leak can't be replayed against the API.
 */
export async function createToken(userId: string, name: string): Promise<{ token: string; id: string }> {
  const { DB } = await getEnv();

  const count = await DB.prepare("SELECT COUNT(*) AS n FROM api_token WHERE user_id = ?1")
    .bind(userId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_PER_USER) {
    throw new Error(`You can have at most ${MAX_PER_USER} tokens. Delete one first.`);
  }

  const token = PREFIX + randomString(40);
  const id = crypto.randomUUID();
  await DB.prepare(
    "INSERT INTO api_token (id, user_id, name, hint, hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  )
    .bind(id, userId, cleanName(name), token.slice(0, PREFIX.length + 6), await sha256(token), Date.now())
    .run();

  return { token, id };
}

/** Scoped by user id so one user can never delete another's token. */
export async function deleteToken(userId: string, id: string): Promise<void> {
  const { DB } = await getEnv();
  await DB.prepare("DELETE FROM api_token WHERE id = ?1 AND user_id = ?2").bind(id, userId).run();
}

export function looksLikeApiToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

/**
 * Resolve a presented token to its owner, recording use. Returns null for
 * anything unknown — callers must treat that as unauthenticated.
 */
export async function resolveToken(env: Env, token: string): Promise<{ userId: string; tokenId: string } | null> {
  if (!looksLikeApiToken(token)) return null;
  const row = await env.DB.prepare("SELECT id, user_id FROM api_token WHERE hash = ?1")
    .bind(await sha256(token))
    .first<{ id: string; user_id: string }>();
  return row ? { userId: row.user_id, tokenId: row.id } : null;
}

export async function touchToken(env: Env, tokenId: string): Promise<void> {
  await env.DB.prepare("UPDATE api_token SET last_used_at = ?1 WHERE id = ?2").bind(Date.now(), tokenId).run();
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 60) || "Untitled token";
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
