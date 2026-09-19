"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";

const items = [
  {
    href: "/",
    label: "Search",
    match: (p: string) => p === "/" || p.startsWith("/icon/"),
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "Library",
    match: (p: string) => p.startsWith("/library"),
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/api",
    label: "API",
    match: (p: string) => p === "/api",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />
      </svg>
    ),
  },
  {
    href: "/licenses",
    label: "Licenses",
    match: (p: string) => p === "/licenses",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 10a2.5 2.5 0 1 0 0 4M16.5 10a2.5 2.5 0 1 0 0 4" />
      </svg>
    ),
  },
];

export function Rail() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 flex h-screen w-[72px] shrink-0 flex-col items-center bg-rail py-3 max-md:hidden">
      <Link href="/" className="mb-4" aria-label="IconsDB home">
        <Image src="/logo.svg" alt="IconsDB" width={40} height={40} priority className="size-10 rounded-xl" />
      </Link>
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.href} href={it.href} className="group flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-fg-muted">
            <span
              className={`grid h-8 w-14 place-items-center rounded-full transition ${
                active ? "bg-accent-soft text-accent dark:text-[#d2e3fc]" : "group-hover:bg-black/5 dark:group-hover:bg-white/5"
              }`}
            >
              {it.icon}
            </span>
            <span className={active ? "text-fg" : ""}>{it.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-2">
        <a href="https://github.com/haxzie/icons-db" target="_blank" rel="noreferrer" aria-label="GitHub" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-black/5 dark:hover:bg-white/5">
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}
