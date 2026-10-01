/** The scope the OAuth provider requires before it will mint a refresh token. */
export const OFFLINE_ACCESS = "offline_access";

/** Stored as a JSON array by Better Auth, but older rows are a plain string. */
export function parseScopeList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Stored as a space- or comma-separated string in some versions.
  }
  return value.split(/[\s,]+/).filter(Boolean);
}

/**
 * Add `offline_access` to an authorization request that forgot to ask for it.
 *
 * MCP clients pick the scopes they authorize with out of our
 * protected-resource metadata, and the MCP plugin deliberately strips OIDC and
 * authorization-server scopes from that document — so every client in the wild
 * requested `mcp:icons` and nothing else. `offline_access` is what makes the
 * provider issue a refresh token, so without it a client got a one-hour access
 * token with no way to renew it: an hour later it was signed out and had to run
 * the whole OAuth dance again.
 *
 * Returns the replacement scope string, or null to leave the request alone.
 */
export function withOfflineAccess(scope: string | null, clientScopes: readonly string[]): string | null {
  const requested = parseScopeList(scope);
  // An omitted scope means "everything this client registered for", which
  // already covers offline_access.
  if (requested.length === 0) return null;
  if (requested.includes(OFFLINE_ACCESS)) return null;
  // Requesting a scope the client never registered is an invalid_scope error,
  // so a client that deliberately stayed out of offline_access keeps working.
  if (!clientScopes.includes(OFFLINE_ACCESS)) return null;
  return [...requested, OFFLINE_ACCESS].join(" ");
}
