"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchKeyword, splitVariant, type CollectionMeta } from "@icons-db/core";
import { useKeywordIndex } from "@/lib/use-search-index";
import { useLocalStorage } from "@/lib/client-utils";
import { TopBar, type SortKey } from "../shell/TopBar";
import { Toolbar, type ViewMode } from "../shell/Toolbar";
import { FilterSidebar, SidebarLabel, SidebarSection } from "../shell/FilterSidebar";
import { ResultsGrid, type GridItem } from "../search/ResultsGrid";
import { IconDetail } from "../icon/IconDetail";
import { LicenseBadge } from "../LicenseBadge";
import type { Selected } from "../search/SearchApp";

export function CollectionBrowser({ collection, collections }: { collection: CollectionMeta; collections: CollectionMeta[] }) {
  const index = useKeywordIndex();
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useLocalStorage("iconsdb:filters", true);
  const [groupVariants, setGroupVariants] = useLocalStorage("iconsdb:group", true);
  const [view, setView] = useLocalStorage<ViewMode>("iconsdb:view", "grid");
  const [color, setColor] = useState("");
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
    const order = q ? searchKeyword(index, q, { limit: 5000 }).filter((h) => h.prefix === collection.prefix).map((h) => h.idx) : null;
    const out: GridItem[] = [];
    const seen = new Map<string, GridItem>();
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
    if (!q || sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [index, prefixIdx, query, style, category, groupVariants, sort, collection.prefix, collection.suffixes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && selected) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const collectionByPrefix = useMemo(() => new Map(collections.map((c) => [c.prefix, c])), [collections]);
  const activeFilters = (style ? 1 : 0) + (category ? 1 : 0);
  const c = collection;

  return (
    <div className="flex flex-1">
      <FilterSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={() => {
          setStyle(null);
          setCategory(null);
          setColor("");
          setGroupVariants(true);
        }}
      >
        <SidebarLabel>About</SidebarLabel>
        <div className="mb-5 rounded-xl border bg-bg-elevated p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{c.name}</span>
            <LicenseBadge license={c.license} withLink />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {c.total.toLocaleString()} icons by{" "}
            {c.author.url ? (
              <a href={c.author.url} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                {c.author.name}
              </a>
            ) : (
              c.author.name
            )}
            {c.homepage && (
              <>
                {" · "}
                <a href={c.homepage} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                  Website
                </a>
              </>
            )}
            {c.version && <span className="ml-1 font-mono">v{c.version}</span>}
            <br />
            {c.license.attribution ? "Attribution required." : "Free for commercial use, no attribution required."}
          </p>
        </div>
        <SidebarLabel>Preview</SidebarLabel>
        <div className="mb-4 flex items-center gap-3 rounded-xl border bg-bg-elevated px-3 py-2.5">
          <label className="relative grid size-8 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border" style={{ background: color || "var(--fg)" }}>
            <input type="color" value={color || "#202124"} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-medium">Icon color</div>
            <div className="truncate font-mono text-xs text-fg-muted">{color || "currentColor"}</div>
          </div>
          {color && (
            <button type="button" onClick={() => setColor("")} className="text-xs text-accent hover:underline">
              Reset
            </button>
          )}
        </div>
        <label className="mb-5 flex cursor-pointer items-center justify-between rounded-xl border bg-bg-elevated px-3 py-2.5 text-sm">
          <span className="font-medium">Group variants</span>
          <input type="checkbox" checked={groupVariants} onChange={(e) => setGroupVariants(e.target.checked)} className="size-4 accent-accent" />
        </label>
        <SidebarLabel>Filter</SidebarLabel>
        {facets.styles.length > 1 && (
          <SidebarSection title="Style">
            <div className="flex flex-wrap gap-2">
              {facets.styles.map((s) => (
                <button key={s} type="button" className="chip" data-active={style === s} onClick={() => setStyle(style === s ? null : s)}>
                  {s}
                </button>
              ))}
            </div>
          </SidebarSection>
        )}
        {facets.categories.length > 0 && (
          <SidebarSection title="Category">
            <div className="flex flex-wrap gap-2">
              {facets.categories.map((cat) => (
                <button key={cat} type="button" className="chip" data-active={category === cat} onClick={() => setCategory(category === cat ? null : cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </SidebarSection>
        )}
      </FilterSidebar>

      <main className="min-w-0 flex-1">
        <TopBar
          ref={inputRef}
          value={query}
          onChange={setQuery}
          placeholder={`Search ${c.name}`}
          sort={sort}
          onSort={setSort}
          title={
            <div className="flex shrink-0 items-center gap-2 text-[22px] font-medium tracking-tight max-sm:hidden">
              <Link href="/library" className="text-fg-muted hover:text-fg">
                Library
              </Link>
              <span className="text-fg-subtle">/</span>
              <span className="max-w-[220px] truncate">{c.name}</span>
            </div>
          }
        />
        <Toolbar filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen(!filtersOpen)} activeFilters={activeFilters} view={view} onView={setView} />
        <div className="mx-auto flex max-w-[1400px] items-start gap-8 px-4 pt-4 md:px-8">
          <div className="min-w-0 flex-1 pb-16">
            <p className="mb-4 text-sm font-medium text-fg-muted">
              {items.length.toLocaleString()} of {c.total.toLocaleString()} icons
              {groupVariants && " (variants grouped)"}
            </p>
            <ResultsGrid
              items={items}
              view={view}
              color={color}
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
      </main>
    </div>
  );
}
