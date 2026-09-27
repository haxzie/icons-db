import { getEnv } from "@/lib/env";

/**
 * Per-user, per-day MCP call counter. Cheap enough to write on every authorized
 * request, and gives "who is actually using the MCP" without a log pipeline.
 * Runs after the response is sent, so a failure here never breaks a tool call.
 */
export async function recordMcpUsage(userId: string, clientId: string | null) {
  try {
    const { DB } = await getEnv();
    const day = new Date().toISOString().slice(0, 10);
    await DB.prepare(
      `INSERT INTO mcp_usage (user_id, client_id, day, requests, last_seen_at)
       VALUES (?1, ?2, ?3, 1, ?4)
       ON CONFLICT(user_id, client_id, day)
       DO UPDATE SET requests = requests + 1, last_seen_at = ?4`,
    )
      .bind(userId, clientId ?? "", day, Date.now())
      .run();
  } catch (err) {
    console.error("[mcp] usage write failed", err);
  }
}
