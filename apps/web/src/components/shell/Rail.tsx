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
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/install",
    label: "MCP",
    match: (p: string) => p === "/install",
    icon: (
      <svg viewBox="0 0 16 16" className="size-6" fill="currentColor">
        <path d="M5.52 1.12a3.578 3.578 0 0 1 6.078 2.98a3.578 3.578 0 0 1 2.982 6.08l-3.292 3.293a.25.25 0 0 0 0 .354l.843.843a.749.749 0 1 1-1.06 1.06l-.844-.843a1.75 1.75 0 0 1 0-2.474L13.52 9.12a2.08 2.08 0 0 0 0-2.94a2.08 2.08 0 0 0-2.94 0L7.731 9.03A.75.75 0 0 1 6.67 7.97l2.85-2.85a2.08 2.08 0 0 0 0-2.94a2.08 2.08 0 0 0-2.94 0l-4.799 4.8A.75.75 0 0 1 .72 5.92Z" />
        <path d="M7.52 3.12a.749.749 0 1 1 1.06 1.06L5.731 7.03A2.079 2.079 0 0 0 8.67 9.97l2.85-2.85a.749.749 0 1 1 1.06 1.06l-2.849 2.85A3.578 3.578 0 0 1 4.67 5.97Z" />
      </svg>
    ),
  },
  {
    href: "/blog",
    label: "Blog",
    match: (p: string) => p.startsWith("/blog"),
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
        <path d="M4 20.5V5.5M8 8h8M8 12h6" />
      </svg>
    ),
  },
  {
    href: "/licenses",
    label: "Licenses",
    match: (p: string) => p === "/licenses",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 10a2.5 2.5 0 1 0 0 4M16.5 10a2.5 2.5 0 1 0 0 4" />
      </svg>
    ),
  },
];

export function Rail() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 flex h-screen w-[88px] shrink-0 flex-col items-center bg-rail py-4 max-md:hidden">
      <Link href="/" className="mb-4" aria-label="IconsDB home">
        <Image src="/logo.svg" alt="IconsDB" width={44} height={44} priority className="size-11 rounded-xl" />
      </Link>
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.href} href={it.href} className="group flex w-full flex-col items-center gap-1.5 py-2.5 text-xs font-medium text-fg-muted">
            <span
              className={`grid h-9 w-16 place-items-center rounded-full transition ${
                active ? "bg-[#c2dbff] text-[#0b57d0] dark:bg-[#2b4a75] dark:text-[#d2e3fc]" : "group-hover:bg-black/5 dark:group-hover:bg-white/5"
              }`}
            >
              {it.icon}
            </span>
            <span className={active ? "font-semibold text-fg" : ""}>{it.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-2">
        <a href="https://github.com/haxzie/icons-db" target="_blank" rel="noreferrer" aria-label="GitHub" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-black/5 dark:hover:bg-white/5">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}
