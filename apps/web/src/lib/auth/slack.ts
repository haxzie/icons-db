import type { Env } from "@/lib/env";

/**
 * Fire-and-forget growth notifications to Slack.
 *
 * Never throws and never blocks the caller: a Slack outage must not fail a
 * signup or an MCP tool call. Silently does nothing when the webhook isn't set,
 * so local development doesn't post into the team channel.
 */
/**
 * Posts and reports whether the message landed. Callers that must tell a user
 * whether their message got through use this; the fire-and-forget `post` below
 * is for notifications nobody is waiting on.
 *
 * Returns "skipped" when no webhook is configured, which is the normal local
 * state — the caller decides whether that counts as success.
 */
async function deliver(env: Env, text: string): Promise<"sent" | "skipped" | "failed"> {
  if (!env.SLACK_WEBHOOK_URL) return "skipped";
  try {
    const res = await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return "sent";
    console.error(`[slack] ${res.status} ${await res.text()}`);
    return "failed";
  } catch (err) {
    console.error("[slack] post failed", err);
    return "failed";
  }
}

async function post(env: Env, text: string) {
  await deliver(env, text);
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

/**
 * A community icon-set submission, awaiting a manual look before we publish it.
 *
 * Unlike the notifications above, someone is waiting on this one: the channel
 * is the only place the submission is recorded, so a failed post means the
 * submission is lost and the user has to be told to try again.
 */
export async function notifySetSubmission(
  env: Env,
  user: { name: string; email: string },
  set: { repo: string; website: string; twitter: string },
): Promise<"sent" | "skipped" | "failed"> {
  const lines = [
    `:inbox_tray: *${user.name}* (${user.email}) submitted an icon set`,
    `• Repo: ${set.repo}`,
    set.website ? `• Website: ${set.website}` : "• Website: _not given_",
    set.twitter ? `• Author on X: https://x.com/${set.twitter}` : "• Author on X: _not given_",
  ];
  const result = await deliver(env, lines.join("\n"));
  // Without a webhook there's nowhere to record this, so say so loudly rather
  // than letting a local test look like it worked.
  if (result === "skipped") console.warn("[slack] SLACK_WEBHOOK_URL unset; set submission not recorded:", lines.join(" "));
  return result;
}
