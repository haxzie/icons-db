import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-fg-muted">That icon or page doesn&apos;t exist.</p>
      <Link href="/" className="rounded-lg border bg-bg-elevated px-3 py-1.5 text-sm hover:border-fg-subtle">
        Back to search
      </Link>
    </main>
  );
}
