import Link from "next/link";
import { AppChrome } from "@/components/shell/AppChrome";

// Lives at the root so it catches URLs matching no route at all, which also
// means no section layout wraps it — it has to bring its own chrome.
export default function NotFound() {
  return (
    <AppChrome>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="text-fg-muted">That icon or page doesn&apos;t exist.</p>
        <Link href="/" className="rounded-lg border bg-bg-elevated px-3 py-1.5 text-sm hover:border-fg-subtle">
          Back to search
        </Link>
      </main>
    </AppChrome>
  );
}
