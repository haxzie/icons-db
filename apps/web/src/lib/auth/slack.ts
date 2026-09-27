import type { Env } from "@/lib/env";

/**
 * Fire-and-forget growth notifications to Slack.
 *
 * Never throws and never blocks the caller: a Slack outage must not fail a
 * signup or an MCP tool call. Silently does nothing when the webhook isn't set,
 * so local development doesn't post into the team channel.
 */
async function post(env: Env, text: string) {
  if (!env.SLACK_WEBHOOK_URL) return;
  try {
    const res = await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[slack] ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("[slack] post failed", err);
  }
}

const PROVIDER_LABELS: Record<string, string> = {
  "magic-link": "email",
  email: "email",
  google: "Google",
  github: "GitHub",
};

export function notifySignUp(env: Env, user: { name: string; email: string }, provider: string) {
  const how = PROVIDER_LABELS[provider] ?? provider;
  return post(env, `:tada: *${user.name}* (${user.email}) signed up via ${how}`);
}

export function notifyMcpConnected(env: Env, user: { name: string; email: string }, appName: string) {
  return post(env, `:electric_plug: *${user.name}* (${user.email}) connected to ${appName} MCP`);
}
