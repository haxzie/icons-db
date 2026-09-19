"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  mergeHits,
  prefixWeight,
  searchKeyword,
  splitVariant,
  styleBucket,
  type CollectionMeta,
  type IconHit,
  type SemanticHit,
  type StyleBucket,
} from "@icons-db/core";
import { useKeywordIndex } from "@/lib/use-search-index";
import { useDebouncedValue, useLocalStorage } from "@/lib/client-utils";
import { TopBar, type SortKey } from "../shell/TopBar";
import { Toolbar, type ViewMode } from "../shell/Toolbar";
import { FilterSidebar } from "../shell/FilterSidebar";
import { SearchFilters, type Kind } from "./SearchFilters";
import { ResultsGrid, type GridItem } from "./ResultsGrid";
import { IconDetail } from "../icon/IconDetail";
import { CollectionsOverview } from "./CollectionsOverview";

export type Selected = { prefix: string; name: string } | null;

const STYLE_BUCKETS: StyleBucket[] = ["outline", "filled", "duotone", "light", "color"];

export function SearchApp({ collections }: { collections: CollectionMeta[] }) {
  const params = useSearchParams();
  const index = useKeywordIndex();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sets, setSets] = useState<string[]>(() => (params.get("sets") ?? "").split(",").filter(Boolean));
  const [kind, setKind] = useState<Kind>(() => (params.get("kind") as Kind) || "all");
  const [style, setStyle] = useState<StyleBucket | null>(() => {
    const s = params.get("style");
    return STYLE_BUCKETS.includes(s as StyleBucket) ? (s as StyleBucket) : null;
  });
  const [noAttribution, setNoAttribution] = useState(params.get("license") === "free");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useLocalStorage("iconsdb:filters", true);
  const [groupVariants, setGroupVariants] = useLocalStorage("iconsdb:group", true);
  const [view, setView] = useLocalStorage<ViewMode>("iconsdb:view", "grid");
  const [color, setColor] = useState("");
  const [selected, setSelected] = useState<Selected>(() => {
    const raw = params.get("icon");
    if (!raw || !raw.includes(":")) return null;
    const [prefix, name] = raw.split(":");
    return { prefix, name };
  });
  const [semantic, setSemantic] = useState<{ query: string; hits: SemanticHit[] }>({ query: "", hits: [] });
  const debouncedQuery = useDebouncedValue(query.trim(), 220);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (sets.length) p.set("sets", sets.join(","));
    if (kind !== "all") p.set("kind", kind);
    if (style) p.set("style", style);
    if (noAttribution) p.set("license", "free");
    if (selected) p.set("icon", `${selected.prefix}:${selected.name}`);
    const qs = p.toString();
    const next = qs ? `/?${qs}` : "/";
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(null, "", next);
  }, [query, sets, kind, style, noAttribution, selected]);

  useEffect(() => {
    if (debouncedQuery.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}&mode=semantic&limit=400`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ icons: SemanticHit[] }>)
      .then((data) => setSemantic({ query: debouncedQuery, hits: data.icons }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [debouncedQuery]);

  const semanticPending = debouncedQuery.length >= 2 && semantic.query !== debouncedQuery;

  const keywordHits = useMemo<IconHit[]>(() => {
    if (!index || !query.trim()) return [];
    return searchKeyword(index, query, { limit: 600, prefixWeight });
  }, [index, query]);

  const hits = useMemo<IconHit[]>(() => {
    if (!query.trim()) return [];
    const sem = semantic.query === debouncedQuery ? semantic.hits : [];
    return mergeHits(keywordHits, sem, { limit: 800 });
  }, [keywordHits, semantic, debouncedQuery, query]);

  const collectionByPrefix = useMemo(() => new Map(collections.map((c) => [c.prefix, c])), [collections]);

  const items = useMemo<GridItem[]>(() => {
    if (!index) return [];
    const suffixesFor = new Map(index.data.prefixes.map((p) => [p.prefix, p.suffixes]));
    const allow = sets.length ? new Set(sets) : null;
    const out: GridItem[] = [];
    const seen = new Map<string, GridItem>();
    for (const h of hits) {
      if (allow && !allow.has(h.prefix)) continue;
      const c = collectionByPrefix.get(h.prefix);
      if (kind !== "all" && (c?.kind ?? "icons") !== kind) continue;
      if (noAttribution && c?.license.attribution) continue;
      const { family, style: styleLabel } = splitVariant(h.name, suffixesFor.get(h.prefix) ?? {});
      if (style && styleBucket(styleLabel, c?.palette) !== style) continue;
      if (groupVariants) {
        const key = `${h.prefix}/${family}`;
        const prev = seen.get(key);
        if (prev) {
          prev.variants += 1;
          continue;
        }
        const item: GridItem = { prefix: h.prefix, name: h.name, family, variants: 1 };
        seen.set(key, item);
        out.push(item);
      } else {
        out.push({ prefix: h.prefix, name: h.name, family, variants: 1 });
      }
    }
    if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name) || a.prefix.localeCompare(b.prefix));
    else if (sort === "set") out.sort((a, b) => a.prefix.localeCompare(b.prefix) || a.name.localeCompare(b.name));
    return out;
  }, [hits, index, sets, kind, noAttribution, style, groupVariants, sort, collectionByPrefix]);

  const countsByPrefix = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hits) m.set(h.prefix, (m.get(h.prefix) ?? 0) + 1);
    return m;
  }, [hits]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape") {
        if (selected) setSelected(null);
        else if (typing && query) setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, query]);

  const toggleSet = useCallback((prefix: string) => {
    setSets((prev) => (prev.includes(prefix) ? prev.filter((p) => p !== prefix) : [...prev, prefix]));
  }, []);

  const reset = () => {
    setSets([]);
    setKind("all");
    setStyle(null);
    setNoAttribution(false);
    setColor("");
    setGroupVariants(true);
  };
  const activeFilters = sets.length + (kind !== "all" ? 1 : 0) + (style ? 1 : 0) + (noAttribution ? 1 : 0);
  const showResults = query.trim().length > 0;
  const total = collections.reduce((n, c) => n + c.total, 0);

  return (
    <div className="flex flex-1">
      <FilterSidebar open={filtersOpen} onClose={() => setFiltersOpen(false)} onReset={reset}>
        <SearchFilters
          collections={collections}
          counts={showResults ? countsByPrefix : null}
          sets={sets}
          onToggleSet={toggleSet}
          onSets={setSets}
          kind={kind}
          onKind={setKind}
          style={style}
          onStyle={setStyle}
          noAttribution={noAttribution}
          onNoAttribution={setNoAttribution}
          groupVariants={groupVariants}
          onGroupVariants={setGroupVariants}
          color={color}
          onColor={setColor}
        />
      </FilterSidebar>

      <main className="min-w-0 flex-1">
        <TopBar
          ref={inputRef}
          value={query}
          onChange={setQuery}
          placeholder="Search icons"
          sort={sort}
          onSort={setSort}
          hint={
            <>
              <kbd>/</kbd> to search
            </>
          }
          onSubmit={() => items[0] && setSelected({ prefix: items[0].prefix, name: items[0].name })}
        />
        <Toolbar filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen(!filtersOpen)} activeFilters={activeFilters} view={view} onView={setView} />

        <div className="mx-auto flex max-w-[1400px] gap-8 px-4 pb-16 pt-4 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm font-medium text-fg-muted">
              {showResults ? (
                <>
                  {items.length.toLocaleString()} {items.length === 1 ? "icon" : "icons"}
                  {groupVariants && " (variants grouped)"}
                  {!index && " · loading index…"}
                  {semanticPending && <span className="ml-2 inline-block size-1.5 animate-pulse rounded-full bg-accent align-middle" />}
                </>
              ) : (
                <>
                  {collections.length} icon sets · {total.toLocaleString()} icons
                </>
              )}
            </p>
            {showResults ? (
              <ResultsGrid
                items={items}
                view={view}
                color={color}
                selected={selected}
                onSelect={(item) => setSelected({ prefix: item.prefix, name: item.name })}
                loading={!index}
                collectionByPrefix={collectionByPrefix}
              />
            ) : (
              <CollectionsOverview collections={collections} onQuery={setQuery} />
            )}
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
