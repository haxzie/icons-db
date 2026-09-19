"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchKeyword, splitVariant, type CollectionMeta } from "@icons-db/core";
import { useKeywordIndex } from "@/lib/use-search-index";
import { useLocalStorage } from "@/lib/client-utils";
import { ResultsGrid, type GridItem } from "../search/ResultsGrid";
import { IconDetail } from "../icon/IconDetail";
import type { Selected } from "../search/SearchApp";

export function CollectionBrowser({ collection, collections }: { collection: CollectionMeta; collections: CollectionMeta[] }) {
  const index = useKeywordIndex();
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [groupVariants, setGroupVariants] = useLocalStorage("iconsdb:group", true);
  const [cellSize, setCellSize] = useLocalStorage("iconsdb:size", 2);
  const [selected, setSelected] = useState<Selected>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefixIdx = index?.data.prefixes.findIndex((p) => p.prefix === collection.prefix) ?? -1;

  const facets = useMemo(() => {
    if (!index || prefixIdx < 0) return { styles: [] as string[], categories: [] as string[] };
    const styles = new Set<string>();
    const cats = new Set<string>();
    for (const e of index.data.icons) {
      if (e[0] !== prefixIdx || e.length === 5) continue;
      styles.add(splitVariant(e[1], collection.suffixes).style);
      if (e[3] >= 0) cats.add(index.data.categories[e[3]]);
    }
    return { styles: Array.from(styles).sort(), categories: Array.from(cats).sort() };
  }, [index, prefixIdx, collection.suffixes]);

  const items = useMemo<GridItem[]>(() => {
    if (!index || prefixIdx < 0) return [];
    const q = query.trim();
    const allowed = q
      ? new Set(searchKeyword(index, q, { limit: 5000 }).filter((h) => h.prefix === collection.prefix).map((h) => h.idx))
      : null;
    const out: GridItem[] = [];
    const seen = new Map<string, GridItem>();
    const order = allowed ? Array.from(allowed) : null;
    const iterate = order ?? index.data.icons.map((_, i) => i);
    for (const i of iterate) {
      const e = index.data.icons[i];
      if (e[0] !== prefixIdx || e.length === 5) continue;
      if (category && index.data.categories[e[3]] !== category) continue;
      const v = splitVariant(e[1], collection.suffixes);
      if (style && v.style !== style) continue;
      if (groupVariants) {
        const prev = seen.get(v.family);
        if (prev) {
          prev.variants += 1;
          continue;
        }
        const item: GridItem = { prefix: collection.prefix, name: e[1], family: v.family, variants: 1 };
        seen.set(v.family, item);
        out.push(item);
      } else {
        out.push({ prefix: collection.prefix, name: e[1], family: v.family, variants: 1 });
      }
    }
    if (!q) out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [index, prefixIdx, query, style, category, groupVariants, collection.prefix, collection.suffixes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && selected) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const collectionByPrefix = useMemo(() => new Map(collections.map((c) => [c.prefix, c])), [collections]);

  return (
    <>
      <div className="sticky top-12 z-20 -mx-4 bg-bg/90 px-4 pb-3 pt-4 backdrop-blur">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${collection.name}…`}
          className="h-10 w-full rounded-lg border bg-bg-elevated px-3 text-sm outline-none ring-accent/40 focus:ring-2"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {facets.styles.length > 1 &&
            facets.styles.map((s) => (
              <Chip key={s} active={style === s} onClick={() => setStyle(style === s ? null : s)}>
                {s}
              </Chip>
            ))}
          {facets.categories.length > 0 && (
            <select
              value={category ?? ""}
              onChange={(e) => setCategory(e.target.value || null)}
              className="rounded-full border bg-bg-elevated px-2 py-0.5 text-xs text-fg-muted"
            >
              <option value="">All categories</option>
              {facets.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <span className="mx-1 h-4 w-px bg-line" />
          <label className="flex cursor-pointer items-center gap-1.5 text-fg-muted">
            <input type="checkbox" checked={groupVariants} onChange={(e) => setGroupVariants(e.target.checked)} className="accent-accent" />
            Group variants
          </label>
          <label className="flex items-center gap-1.5 text-fg-muted">
            Size
            <input type="range" min={1} max={4} value={cellSize} onChange={(e) => setCellSize(Number(e.target.value))} className="w-20 accent-accent" />
          </label>
          <span className="ml-auto tabular-nums text-fg-subtle">{items.length.toLocaleString()} icons</span>
        </div>
      </div>
      <div className="flex flex-1 gap-6">
        <div className="min-w-0 flex-1">
          <ResultsGrid
            items={items}
            cellSize={cellSize}
            selected={selected}
            onSelect={(item) => setSelected({ prefix: item.prefix, name: item.name })}
            loading={!index}
            collectionByPrefix={collectionByPrefix}
          />
        </div>
        {selected && index && (
          <IconDetail
            key={`${selected.prefix}:${selected.name}`}
            prefix={selected.prefix}
            name={selected.name}
            index={index}
            collection={collectionByPrefix.get(selected.prefix)}
            onClose={() => setSelected(null)}
            onSelect={(prefix, name) => setSelected({ prefix, name })}
          />
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 ${active ? "border-accent bg-accent/10 text-fg" : "border-line bg-bg-elevated text-fg-muted hover:text-fg"}`}
    >
      {children}
    </button>
  );
}
