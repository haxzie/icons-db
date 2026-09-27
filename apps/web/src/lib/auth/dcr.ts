/** The only hosts the OAuth provider accepts for a native client's http redirect. */
// WHATWG URL keeps the brackets on IPv6 hostnames, so match that form.
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isHttpLoopback(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    // hostname drops the port but keeps [] around an IPv6 literal.
    return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Dynamic client registration defaults `application_type` to "web" (per OIDC),
 * and a web client is forbidden from using loopback redirect URIs. Desktop MCP
 * clients register with `http://127.0.0.1:<port>/callback` and omit the field,
 * so every one of them was rejected with "web clients require https redirect
 * URIs on non-loopback hosts".
 *
 * They are native clients by any reasonable reading, so label them as such when
 * every redirect URI they asked for is an http loopback address. Anything else
 * passes through untouched and is still validated normally.
 */
export function withNativeApplicationType(body: Record<string, unknown>): Record<string, unknown> | null {
  if (body.application_type !== undefined) return null;
  const uris = body.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0 || !uris.every(isHttpLoopback)) return null;
  return { ...body, application_type: "native" };
}
