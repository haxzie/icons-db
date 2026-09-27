// Secrets set with `wrangler secret put`; they don't appear in wrangler.jsonc,
// so they can't be picked up by `wrangler types`.
interface CloudflareEnv {
  /** Signs sessions, OAuth codes and the signed authorization query. Required. */
  BETTER_AUTH_SECRET: string;
  /** Origin override for local development, e.g. http://localhost:3000. */
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Incoming webhook for signup / MCP-connect notifications. Optional. */
  SLACK_WEBHOOK_URL?: string;
}
