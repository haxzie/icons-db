"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconGlyph } from "../IconGlyph";
import { PROMOS, type Promo } from "@/lib/promos";

const SQUIRCLE =
  "polygon(50% 0%, 62% 5%, 76% 3%, 86% 12%, 97% 22%, 95% 36%, 100% 50%, 95% 64%, 97% 78%, 86% 88%, 76% 97%, 62% 95%, 50% 100%, 38% 95%, 24% 97%, 14% 88%, 3% 78%, 5% 64%, 0% 50%, 5% 36%, 3% 22%, 14% 12%, 24% 3%, 38% 5%)";

export function PromoCards({ items = PROMOS }: { items?: Promo[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 640, behavior: "smooth" });

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 pb-3 pt-2 md:px-8">
      <div ref={scroller} className="scrollbar-none flex snap-x gap-4 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
        {items.map((p) => {
          const external = p.href.startsWith("http") || p.href.startsWith("mailto:");
          const Comp = external ? "a" : Link;
          return (
            <Comp
              key={p.id}
              href={p.href}
              {...(external ? { target: "_blank", rel: "noreferrer sponsored" } : {})}
              className="group flex w-[320px] shrink-0 snap-start items-center justify-between gap-4 rounded-3xl bg-[#f3f6fc] px-6 py-5 transition hover:bg-[#e8f0fe] dark:bg-bg-elevated dark:hover:bg-bg-muted"
            >
              <div className="min-w-0">
                <div className="truncate text-[17px] font-medium leading-snug">{p.title}</div>
                <div className="mt-1 line-clamp-2 text-sm leading-snug text-fg-muted">{p.tagline}</div>
                {p.sponsored && <div className="mt-1.5 text-[10px] uppercase tracking-wide text-fg-subtle">Sponsored</div>}
              </div>
              <span
                className="grid size-14 shrink-0 place-items-center bg-[#c2e0ff] text-[#0b57d0] dark:bg-[#2b4a75] dark:text-[#d2e3fc]"
                style={{ clipPath: SQUIRCLE }}
              >
                <IconGlyph prefix={p.icon.split(":")[0]} name={p.icon.split(":")[1]} className="size-6" />
              </span>
            </Comp>
          );
        })}
      </div>
      {canScroll.left && (
        <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] hover:bg-bg-muted md:left-6">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        </button>
      )}
      {canScroll.right && (
        <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] hover:bg-bg-muted md:right-6">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      )}
    </div>
  );
}
