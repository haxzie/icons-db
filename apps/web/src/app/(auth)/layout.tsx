/**
 * Sign-in and OAuth consent run without the rail. A user deciding whether to
 * hand an app access to their account shouldn't have navigation inviting them
 * out of the flow, and an authorization screen reads as a dialog, not a page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>;
}
