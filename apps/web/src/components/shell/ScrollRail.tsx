"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A horizontally snapping row of cards with overlay arrows.
 *
 * The arrows only exist while there is something in that direction to scroll
 * to, which is also how the row stays honest on touch: nothing is rendered that
 * cannot be used, and the swipe is the real control.
 */
export function ScrollRail({ children, className = "", step = 640 }: { children: React.ReactNode; className?: string; step?: number }) {
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

  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * step, behavior: "smooth" });

  return (
    <div className={`relative ${className}`}>
      <div ref={scroller} className="scrollbar-none flex snap-x gap-4 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
      {canScroll.left && <Arrow dir={-1} onClick={() => scrollBy(-1)} />}
      {canScroll.right && <Arrow dir={1} onClick={() => scrollBy(1)} />}
    </div>
  );
}

function Arrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 1 ? "Scroll right" : "Scroll left"}
      onClick={onClick}
      className={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] hover:bg-bg-muted ${dir === 1 ? "right-2 md:right-6" : "left-2 md:left-6"}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 1 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
      </svg>
    </button>
  );
}
