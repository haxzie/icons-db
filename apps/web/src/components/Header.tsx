import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-accent-fg">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M4 12h10M4 17h7" />
            </svg>
          </span>
          IconsDB
        </Link>
        <nav className="flex items-center gap-4 text-sm text-fg-muted">
          <Link href="/" className="hover:text-fg">Search</Link>
          <Link href="/library" className="hover:text-fg">Library</Link>
          <Link href="/api" className="hover:text-fg">API</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/haxzie/icons-db"
            className="text-sm text-fg-muted hover:text-fg"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
