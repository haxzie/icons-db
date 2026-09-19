"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { SearchBar } from "./SearchBar";
import { Filters } from "./Filters";
import { ResultsGrid, type GridItem } from "./ResultsGrid";
import { IconDetail } from "../icon/IconDetail";
import { CollectionsOverview } from "./CollectionsOverview";

export type Selected = { prefix: string; name: string } | null;

const STYLE_BUCKETS: StyleBucket[] = ["outline", "filled", "duotone", "light", "color"];

export function SearchApp({ collections }: { collections: CollectionMeta[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const index = useKeywordIndex();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sets, setSets] = useState<string[]>(() => (params.get("sets") ?? "").split(",").filter(Boolean));
  const [style, setStyle] = useState<StyleBucket | null>(() => {
    const s = params.get("style");
    return STYLE_BUCKETS.includes(s as StyleBucket) ? (s as StyleBucket) : null;
  });
  const [groupVariants, setGroupVariants] = useLocalStorage("iconsdb:group", true);
  const [cellSize, setCellSize] = useLocalStorage("iconsdb:size", 2);
  const [selected, setSelected] = useState<Selected>(() => {
    const raw = params.get("icon");
    if (!raw || !raw.includes(":")) return null;
    const [prefix, name] = raw.split(":");
    return { prefix, name };
  });
  const [semantic, setSemantic] = useState<{ query: string; hits: SemanticHit[] }>({ query: "", hits: [] });
  const debouncedQuery = useDebouncedValue(query.trim(), 220);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep url shareable
  useEffect(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (sets.length) p.set("sets", sets.join(","));
    if (style) p.set("style", style);
    if (selected) p.set("icon", `${selected.prefix}:${selected.name}`);
    const qs = p.toString();
    const next = qs ? `/?${qs}` : "/";
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", next);
    }
  }, [query, sets, style, selected]);

  // semantic search (edge) for anything longer than a couple of characters
  useEffect(() => {
    if (debouncedQuery.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}&mode=semantic&limit=400`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ icons: SemanticHit[] }>)
      .then((data) => {
        setSemantic({ query: debouncedQuery, hits: data.icons });
      })
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

  const items = useMemo<GridItem[]>(() => {
    if (!index) return [];
    const suffixesFor = new Map(index.data.prefixes.map((p) => [p.prefix, p.suffixes]));
    const allow = sets.length ? new Set(sets) : null;
    const out: GridItem[] = [];
    const seen = new Map<string, GridItem>();
    for (const h of hits) {
      if (allow && !allow.has(h.prefix)) continue;
      const { family, style: styleLabel } = splitVariant(h.name, suffixesFor.get(h.prefix) ?? {});
      if (style && styleBucket(styleLabel) !== style) continue;
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
    return out;
  }, [hits, index, sets, style, groupVariants]);

  const countsByPrefix = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hits) m.set(h.prefix, (m.get(h.prefix) ?? 0) + 1);
    return m;
  }, [hits]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
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

  const collectionByPrefix = useMemo(() => new Map(collections.map((c) => [c.prefix, c])), [collections]);
  const showResults = query.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-16">
      <SearchBar
        ref={inputRef}
        value={query}
        onChange={setQuery}
        loading={!index && showResults}
        pending={semanticPending}
        resultCount={showResults ? items.length : null}
        onSubmit={() => items[0] && setSelected({ prefix: items[0].prefix, name: items[0].name })}
      />
      <Filters
        collections={collections}
        selectedSets={sets}
        onToggleSet={toggleSet}
        onClearSets={() => setSets([])}
        counts={showResults ? countsByPrefix : null}
        style={style}
        onStyle={setStyle}
        groupVariants={groupVariants}
        onGroupVariants={setGroupVariants}
        cellSize={cellSize}
        onCellSize={setCellSize}
      />
      <div className="flex flex-1 gap-6">
        <div className="min-w-0 flex-1">
          {showResults ? (
            <ResultsGrid
              items={items}
              cellSize={cellSize}
              selected={selected}
              onSelect={(item) => setSelected({ prefix: item.prefix, name: item.name })}
              loading={!index}
              collectionByPrefix={collectionByPrefix}
            />
          ) : (
            <CollectionsOverview
              collections={collections}
              onPick={(prefix) => router.push(`/library/${prefix}`)}
              onQuery={setQuery}
            />
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
    </div>
  );
}
