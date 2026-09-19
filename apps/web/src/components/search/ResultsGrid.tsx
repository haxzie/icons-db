"use client";

import { useEffect, useRef, useState } from "react";
import type { CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import type { Selected } from "./SearchApp";
import type { ViewMode } from "../shell/Toolbar";

export type GridItem = { prefix: string; name: string; family: string; variants: number };

const PAGE = 144;
const LAYOUT: Record<ViewMode, { grid: string; glyph: string; label: boolean }> = {
  compact: { grid: "grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5", glyph: "size-7", label: false },
  grid: { grid: "grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3", glyph: "size-9", label: true },
  large: { grid: "grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4", glyph: "size-14", label: true },
};

type Props = {
  items: GridItem[];
  view: ViewMode;
  color?: string;
  selected: Selected;
  onSelect: (item: GridItem) => void;
  loading: boolean;
  collectionByPrefix: Map<string, CollectionMeta>;
};

export function ResultsGrid({ items, view, color, selected, onSelect, loading, collectionByPrefix }: Props) {
  const [limit, setLimit] = useState(PAGE);
  const [prevItems, setPrevItems] = useState(items);
  const sentinel = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  if (prevItems !== items) {
    setPrevItems(items);
    setLimit(PAGE);
  }

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((l) => Math.min(l + PAGE, items.length));
    });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length]);

  function onKeyDown(e: React.KeyboardEvent) {
    const cells = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>("button[data-cell]") ?? []);
    const i = cells.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const cols = getComputedStyle(grid.current!).gridTemplateColumns.split(" ").length;
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    cells[Math.max(0, Math.min(cells.length - 1, next))]?.focus();
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-fg-subtle">Loading icon index…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-fg-muted">No icons matched.</p>
        <p className="mt-1 text-sm text-fg-subtle">Try a different phrase, or clear the filters.</p>
      </div>
    );
  }

  const layout = LAYOUT[view];
  const visible = items.slice(0, limit);
  return (
    <div style={{ color: color || undefined }}>
      <div ref={grid} onKeyDown={onKeyDown} className={`grid ${layout.grid}`}>
        {visible.map((item) => {
          const active = selected?.prefix === item.prefix && selected?.name === item.name;
          const set = collectionByPrefix.get(item.prefix)?.name ?? item.prefix;
          return (
            <button
              key={`${item.prefix}:${item.name}`}
              type="button"
              data-cell
              onClick={() => onSelect(item)}
              title={`${set} · ${item.name}`}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-bg-elevated hover:border-accent hover:ring-1 hover:ring-accent hover:shadow-[0_2px_10px_rgba(26,115,232,.3)]"
              }`}
            >
              <IconGlyph prefix={item.prefix} name={item.name} className={layout.glyph} />
              {layout.label && (
                <span className="absolute inset-x-2 bottom-2 truncate text-center text-[11px] leading-tight text-fg-muted">
                  <span className="block truncate text-fg">{item.name}</span>
                  {view === "large" && <span className="block truncate text-fg-subtle">{set}</span>}
                </span>
              )}
              {item.variants > 1 && (
                <span className="absolute right-2 top-2 rounded-full bg-bg-muted px-1.5 text-[10px] leading-4 text-fg-muted tabular-nums">
                  {item.variants}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {limit < items.length && <div ref={sentinel} className="h-10" />}
    </div>
  );
}
