import Link from "next/link";
import { IconGlyph } from "../IconGlyph";
import { ScrollRail } from "./ScrollRail";
import { PROMOS, type Promo } from "@/lib/promos";

const SQUIRCLE =
  "polygon(50% 0%, 62% 5%, 76% 3%, 86% 12%, 97% 22%, 95% 36%, 100% 50%, 95% 64%, 97% 78%, 86% 88%, 76% 97%, 62% 95%, 50% 100%, 38% 95%, 24% 97%, 14% 88%, 3% 78%, 5% 64%, 0% 50%, 5% 36%, 3% 22%, 14% 12%, 24% 3%, 38% 5%)";

export function PromoCards({ items = PROMOS }: { items?: Promo[] }) {
  return (
    <ScrollRail className="mx-auto max-w-[1400px] px-4 pb-3 pt-2 md:px-8">
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
    </ScrollRail>
  );
}
