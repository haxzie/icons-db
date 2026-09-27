import type { Env } from "@/lib/env";

const MAX_BYTES = 1024 * 1024; // 1 MiB — provider avatars are far smaller
const FETCH_TIMEOUT_MS = 5000;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Avatars we host are served from this path; see src/app/avatars/[...key]/route.ts. */
export const AVATAR_PATH = "/avatars/";

export function isSelfHosted(url: string | null | undefined): boolean {
  return !!url && url.startsWith(AVATAR_PATH);
}

/**
 * Copy a provider's profile picture into R2 and return the path we serve it
 * from. Provider-hosted avatar URLs rot (GitHub rotates them, Google's expire),
 * so we keep our own copy and only ever store our URL on the user row.
 *
 * Returns null when the source can't be mirrored — callers keep whatever image
 * they already had rather than losing the avatar entirely.
 */
export async function mirrorAvatar(env: Env, userId: string, sourceUrl: string): Promise<string | null> {
  if (isSelfHosted(sourceUrl)) return sourceUrl;
  if (!/^https?:\/\//i.test(sourceUrl)) return null;

  try {
    const res = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "image/*" },
    });
    if (!res.ok || !res.body) return null;

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const ext = EXTENSIONS[contentType];
    if (!ext) return null;

    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > MAX_BYTES) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;

    // Content-addressed so a changed provider picture lands on a new URL and
    // never serves a stale cached copy.
    const key = `${userId}/${await digest(bytes)}.${ext}`;
    await env.AVATARS.put(key, bytes, { httpMetadata: { contentType } });
    return `${AVATAR_PATH}${key}`;
  } catch {
    return null;
  }
}

async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return [...new Uint8Array(hash).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
