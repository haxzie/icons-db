"use client";

import { useEffect, useState } from "react";
import type { SemanticHit } from "@icons-db/core";
import { useLocalSemanticSearch } from "./semantic-client";
import { useDebouncedValue } from "./client-utils";

/**
 * Semantic hits for a query. Runs the embedding model locally in a worker
 * (see semantic-client.ts); if that fails to load, falls back to the edge
 * API, optionally restricted to `prefixes`.
 */
export function useSemanticHits(query: string, opts: { prefixes?: string[]; limit?: number } = {}) {
  const limit = opts.limit ?? 400;
  const prefixKey = opts.prefixes?.join(",") ?? "";
  const debouncedQuery = useDebouncedValue(query.trim(), 220);
  const [semantic, setSemantic] = useState<{ query: string; hits: SemanticHit[] }>({ query: "", hits: [] });
  const local = useLocalSemanticSearch();
  const localState = local.status.state;

  useEffect(() => {
    if (debouncedQuery.length < 2) return;

    if (localState === "error") {
      const ctrl = new AbortController();
      const qs = new URLSearchParams({ q: debouncedQuery, mode: "semantic", limit: String(limit) });
      if (prefixKey) qs.set("prefixes", prefixKey);
      fetch(`/api/v1/search?${qs}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<{ icons: SemanticHit[] }>)
        .then((data) => setSemantic({ query: debouncedQuery, hits: data.icons }))
        .catch(() => {});
      return () => ctrl.abort();
    }

    if (localState !== "ready") return;
    let alive = true;
    // The local model scores every text; ask for more when we'll filter by set.
    local.search(debouncedQuery, prefixKey ? limit * 4 : limit)?.then((res) => {
      if (!alive || !res) return;
      const allow = prefixKey ? new Set(prefixKey.split(",")) : null;
      setSemantic({ query: debouncedQuery, hits: allow ? res.hits.filter((h) => allow.has(h.prefix)).slice(0, limit) : res.hits });
    });
    return () => {
      alive = false;
    };
  }, [debouncedQuery, localState, local, limit, prefixKey]);

  const ready = semantic.query === debouncedQuery;
  return {
    hits: ready ? semantic.hits : [],
    debouncedQuery,
    pending: debouncedQuery.length >= 2 && !ready && localState !== "error",
  };
}
