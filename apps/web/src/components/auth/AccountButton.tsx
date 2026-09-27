"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Avatar } from "./Avatar";

/**
 * Rail footer control: the signed-in user's avatar linking to their profile,
 * or a sign-in link when signed out.
 */
export function AccountButton() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const active = pathname.startsWith("/profile");

  if (isPending) return <span className="size-9 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />;

  if (!session) {
    return (
      <Link
        href="/sign-in"
        aria-label="Sign in"
        title="Sign in"
        className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-black/5 dark:hover:bg-white/5"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      title={session.user.name}
      aria-current={active ? "page" : undefined}
      className={`grid size-9 place-items-center rounded-full transition ${
        active ? "ring-2 ring-accent ring-offset-2 ring-offset-rail" : "hover:bg-black/5 dark:hover:bg-white/5"
      }`}
    >
      <Avatar src={session.user.image} name={session.user.name} size={32} />
    </Link>
  );
}
