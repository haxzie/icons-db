"use server";

import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { notifySetSubmission } from "@/lib/auth/slack";
import { getEnv } from "@/lib/env";
import { validateSubmission, type SubmitSetResult } from "@/lib/submissions";

export async function submitSetAction(raw: {
  repo: string;
  website: string;
  twitter: string;
}): Promise<SubmitSetResult> {
  // Re-read the session server-side; the dialog gating on `useSession` is a UX
  // affordance, not access control.
  const session = await getSession(await headers());
  if (!session) return { ok: false, error: "Please sign in again to submit a set." };

  const parsed = validateSubmission(raw);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const env = await getEnv();
  if (env.API_RATE_LIMIT) {
    // Keyed by user, not IP: this action is already behind a session, and one
    // signed-in account flooding the channel is the case worth stopping.
    const { success } = await env.API_RATE_LIMIT.limit({ key: `submit-set:${session.user.id}` });
    if (!success) return { ok: false, error: "That's a lot of submissions at once — give it a minute and try again." };
  }

  const delivery = await notifySetSubmission(env, session.user, parsed.value);
  if (delivery === "failed") {
    return { ok: false, error: "We couldn't record your submission just now. Please try again in a moment." };
  }
  return { ok: true };
}
