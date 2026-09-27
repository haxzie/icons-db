"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { revokeGrant } from "@/lib/auth/grants";
import { createToken, deleteToken } from "@/lib/auth/tokens";

/** Every action re-reads the session server-side; the client never sends a user id. */
async function requireUser() {
  const session = await getSession(await headers());
  if (!session) throw new Error("Not signed in");
  return session.user;
}

export async function createTokenAction(name: string): Promise<{ token?: string; error?: string }> {
  try {
    const user = await requireUser();
    const { token } = await createToken(user.id, name);
    revalidatePath("/profile");
    return { token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't create the token." };
  }
}

export async function deleteTokenAction(id: string): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    await deleteToken(user.id, id);
    revalidatePath("/profile");
    return {};
  } catch {
    return { error: "Couldn't delete the token." };
  }
}

export async function revokeGrantAction(consentId: string): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    await revokeGrant(user.id, consentId);
    revalidatePath("/profile");
    return {};
  } catch {
    return { error: "Couldn't revoke access." };
  }
}
