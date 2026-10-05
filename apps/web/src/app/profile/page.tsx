import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listGrants } from "@/lib/auth/grants";
import { listTokens } from "@/lib/auth/tokens";
import { Avatar } from "@/components/auth/Avatar";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { SignOutButton } from "@/components/profile/SignOutButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const [grants, tokens] = await Promise.all([listGrants(session.user.id), listTokens(session.user.id)]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 md:px-8">
      <header className="flex items-center gap-4">
        <Avatar src={session.user.image} name={session.user.name} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-medium tracking-tight">{session.user.name}</h1>
          <p className="truncate text-sm text-fg-muted">{session.user.email}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Joined {new Date(session.user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </p>
        </div>
        <SignOutButton />
      </header>

      <ProfileTabs grants={grants} tokens={tokens} />
    </main>
  );
}
