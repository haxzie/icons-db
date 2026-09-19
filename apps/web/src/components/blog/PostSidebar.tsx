"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id: string; text: string; level: 2 | 3 };

export function PostSidebar({ toc, backHref, backLabel, variant = "aside" }: { toc: Entry[]; backHref: string; backLabel: string; variant?: "aside" | "inline" }) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    const headings = toc.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [toc]);

  const nav = (
    <ul className="px-1 pt-1">
      {toc.map((t) => {
        const on = t.id === active;
        return (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              onClick={() => setActive(t.id)}
              className={`block truncate rounded-lg py-2 text-[15px] transition ${t.level === 3 ? "pl-7 pr-2 text-sm" : "px-2 font-medium"} ${
                on ? "bg-accent-soft text-fg" : "text-fg-muted hover:bg-black/5 hover:text-fg dark:hover:bg-white/5"
              }`}
            >
              {t.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "inline") {
    if (!toc.length) return null;
    return (
      <details className="rounded-2xl border bg-bg-elevated">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">On this page</summary>
        <div className="px-2 pb-2">{nav}</div>
      </details>
    );
  }

  return (
    <aside className="scrollbar-thin sticky top-0 hidden h-screen w-[320px] shrink-0 overflow-y-auto bg-panel md:block">
        <div className="px-5 pb-10 pt-4">
          <Link href={backHref} className="-ml-2 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[15px] font-medium text-fg-muted hover:bg-black/5 hover:text-fg dark:hover:bg-white/5">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7M5 12h14" />
            </svg>
            {backLabel}
          </Link>
          {toc.length > 0 && (
            <section className="mt-4 border-t py-3">
              <div className="flex items-center gap-3 px-1 py-2 text-base font-semibold">
                <span className="grid size-6 place-items-center text-fg-muted">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </span>
                On this page
              </div>
              {nav}
            </section>
          )}
        </div>
      </aside>
  );
}
