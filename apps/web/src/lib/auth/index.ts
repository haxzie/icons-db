import { getEnv } from "@/lib/env";
import { createAuth, mcpResource, type Auth } from "./config";

export { MCP_SCOPE, mcpResource } from "./config";
export type { Auth } from "./config";

// Bindings only exist per-request on Workers, so the instance can't be built at
// module scope. Cache it per env object: one instance per isolate, rebuilt if
// the runtime hands us a different env.
let cached: { env: unknown; auth: Auth } | null = null;

export async function getAuth(): Promise<Auth> {
  const env = await getEnv();
  if (cached?.env === env) return cached.auth;
  const auth = createAuth(env);
  cached = { env, auth };
  return auth;
}

/** The MCP protected-resource identifier for the running environment. */
export async function getMcpResource(): Promise<string> {
  return mcpResource(await getEnv());
}

/** The signed-in user for a server component or route handler, or null. */
export async function getSession(headers: Headers) {
  const auth = await getAuth();
  return auth.api.getSession({ headers });
}
