import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { SignInForm } from "@/components/auth/SignInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to IconsDB to connect the MCP server to your coding agent.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getSession(await headers());

  // The OAuth provider sends the user here mid-authorization; once a session
  // exists it resumes the flow itself, so just bounce back to /authorize.
  const oauthQuery = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  ).toString();
  const isOAuthFlow = !!params.client_id && !!params.sig;

  // `?next=` returns the user to the page that sent them here. Only same-site
  // paths: a full URL, "//host", or "/\host" would make this an open redirect
  // (browsers normalise the backslash to a slash, so it has to be rejected too).
  const next = typeof params.next === "string" && /^\/(?![/\\])/.test(params.next) ? params.next : "/";

  if (session) redirect(isOAuthFlow ? `/api/auth/oauth2/authorize?${oauthQuery}` : next);

  const callbackURL = isOAuthFlow ? `/api/auth/oauth2/authorize?${oauthQuery}` : next;

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={36} height={36} className="size-9 rounded-xl" />
        </Link>
        <h1 className="text-2xl font-medium tracking-tight">Sign in to IconsDB</h1>
        <p className="text-sm text-fg-muted">
          {isOAuthFlow
            ? "Sign in to let your coding agent use the IconsDB MCP server."
            : "Search stays free and open. Signing in connects the MCP server to your agent."}
        </p>
      </div>

      <SignInForm callbackURL={callbackURL} />
    </main>
  );
}
