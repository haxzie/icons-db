"use client";

import { useEffect, useState } from "react";
import { buildKeywordIndex, type KeywordIndex, type SearchIndexData } from "@icons-db/core";
import { indexBuffer } from "./search-index-source";

type Built = { tokens: string[]; postings: Int32Array[] };

let cached: Promise<KeywordIndex> | null = null;

/** Build the token/posting index in a worker from the same bytes the main
 * thread is about to parse. Resolves null if no worker could do the job, so
 * the caller can fall back to a main-thread build. */
function buildViaWorker(buffer: ArrayBuffer): Promise<Built | null> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./search-index.worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve(null);
      return;
    }
    const timeout = setTimeout(() => {
      worker.terminate();
      resolve(null);
    }, 15000);
    worker.onmessage = (e: MessageEvent<{ ok: boolean; tokens?: string[]; postings?: Int32Array[] }>) => {
      clearTimeout(timeout);
      worker.terminate();
      const { ok, tokens, postings } = e.data;
      resolve(ok && tokens && postings ? { tokens, postings } : null);
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(null);
    };
    // Cloned, not transferred: the semantic worker and the parse below read the
    // same bytes.
    worker.postMessage({ buffer });
  });
}

export function loadKeywordIndex(): Promise<KeywordIndex> {
  if (!cached) {
    cached = indexBuffer()
      .then(async (buffer) => {
        // Hand the worker its copy before parsing, not after: the tokenise +
        // posting build is the long pole (~0.5s) and the main thread still
        // needs the raw arrays for faceting and the grid, so the two parses
        // should overlap rather than queue up.
        const built = typeof Worker !== "undefined" ? buildViaWorker(buffer) : Promise.resolve(null);
        const data = JSON.parse(new TextDecoder().decode(buffer)) as SearchIndexData;
        const fromWorker = await built;
        return fromWorker ? { data, ...fromWorker } : buildKeywordIndex(data);
      })
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
