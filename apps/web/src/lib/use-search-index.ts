"use client";

import { useEffect, useState } from "react";
import { buildKeywordIndex, type KeywordIndex, type SearchIndexData } from "@icons-db/core";

const URL_PATH = "/data/search-index.json";

let cached: Promise<KeywordIndex> | null = null;

/** Build the token/posting index in a worker, parse `data` on the main thread
 * in parallel. Falls back to a fully main-thread build if workers are absent. */
function buildViaWorker(data: SearchIndexData): Promise<KeywordIndex> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./search-index.worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve(buildKeywordIndex(data));
      return;
    }
    const timeout = setTimeout(() => {
      worker.terminate();
      resolve(buildKeywordIndex(data));
    }, 15000);
    worker.onmessage = (e: MessageEvent<{ ok: boolean; tokens?: string[]; postings?: Int32Array[] }>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (e.data.ok && e.data.tokens && e.data.postings) {
        resolve({ data, tokens: e.data.tokens, postings: e.data.postings });
      } else {
        resolve(buildKeywordIndex(data));
      }
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(buildKeywordIndex(data));
    };
    worker.postMessage({ url: new URL(URL_PATH, location.origin).href });
  });
}

export function loadKeywordIndex(): Promise<KeywordIndex> {
  if (!cached) {
    cached = fetch(URL_PATH)
      .then((r) => r.json() as Promise<SearchIndexData>)
      .then((data) => (typeof Worker !== "undefined" ? buildViaWorker(data) : buildKeywordIndex(data)))
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
