"use client";

import { useEffect, useState } from "react";
import { buildKeywordIndex, type KeywordIndex, type SearchIndexData } from "@icons-db/core";

let cached: Promise<KeywordIndex> | null = null;

export function loadKeywordIndex(): Promise<KeywordIndex> {
  if (!cached) {
    cached = fetch("/data/search-index.json")
      .then((r) => r.json() as Promise<SearchIndexData>)
      .then((data) => buildKeywordIndex(data))
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

export function useKeywordIndex(): KeywordIndex | null {
  const [index, setIndex] = useState<KeywordIndex | null>(null);
  useEffect(() => {
    let alive = true;
    loadKeywordIndex().then((i) => alive && setIndex(i));
    return () => {
      alive = false;
    };
  }, []);
  return index;
}
