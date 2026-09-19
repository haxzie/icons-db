"use client";

import { useEffect, useRef, useState } from "react";
import type { CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import type { Selected } from "./SearchApp";

export type GridItem = { prefix: string; name: string; family: string; variants: number };

const PAGE = 144;
const SIZES: Record<number, string> = {
  1: "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]",
  2: "grid-cols-[repeat(auto-fill,minmax(72px,1fr))]",
  3: "grid-cols-[repeat(auto-fill,minmax(96px,1fr))]",
  4: "grid-cols-[repeat(auto-fill,minmax(128px,1fr))]",
};
const GLYPH: Record<number, string> = { 1: "size-6", 2: "size-7", 3: "size-9", 4: "size-12" };

type Props = {
  items: GridItem[];
  cellSize: number;
  selected: Selected;
  onSelect: (item: GridItem) => void;
  loading: boolean;
  collectionByPrefix: Map<string, CollectionMeta>;
};

export function ResultsGrid({ items, cellSize, selected, onSelect, loading, collectionByPrefix }: Props) {
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
        <p className="mt-1 text-sm text-fg-subtle">Try a different phrase, or clear the set / style filters.</p>
      </div>
    );
  }

  const visible = items.slice(0, limit);
  return (
    <div>
      <div ref={grid} onKeyDown={onKeyDown} className={`grid gap-1 ${SIZES[cellSize] ?? SIZES[2]}`}>
        {visible.map((item) => {
          const active = selected?.prefix === item.prefix && selected?.name === item.name;
          return (
            <button
              key={`${item.prefix}:${item.name}`}
              type="button"
              data-cell
              onClick={() => onSelect(item)}
              title={`${collectionByPrefix.get(item.prefix)?.name ?? item.prefix} · ${item.name}`}
              className={`icon-cell group relative flex aspect-square flex-col items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? "border-accent bg-accent/10" : "border-transparent hover:border-line hover:bg-bg-elevated"
              }`}
            >
              <IconGlyph prefix={item.prefix} name={item.name} className={GLYPH[cellSize] ?? GLYPH[2]} />
              {cellSize >= 3 && (
                <span className="mt-1.5 w-full truncate px-1 text-center text-[10px] leading-tight text-fg-subtle group-hover:text-fg-muted">
                  {item.name}
                </span>
              )}
              {item.variants > 1 && (
                <span className="absolute right-1 top-1 rounded-full bg-bg-muted px-1 text-[9px] leading-4 text-fg-subtle tabular-nums">
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
