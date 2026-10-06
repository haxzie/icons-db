"use client";

const URL_PATH = "/data/search-index.json";

declare global {
  interface Window {
    /** Set by <PrefetchSearchIndex />; resolves null if that fetch failed. */
    __iconsIndex?: Promise<ArrayBuffer | null> | null;
  }
}

let pending: Promise<ArrayBuffer> | null = null;

/**
 * The one `/data/search-index.json` response, shared by the grid on the main
 * thread, the keyword-index worker and the semantic worker. Prefers the fetch
 * <PrefetchSearchIndex /> starts during HTML parse; falls back to its own when
 * that script didn't run (a soft client-side navigation onto a search route)
 * or its fetch failed.
 */
export function indexBuffer(): Promise<ArrayBuffer> {
  if (!pending) {
    pending = (window.__iconsIndex ?? Promise.resolve(null))
      .then((buf) => buf ?? fetch(URL_PATH).then((r) => r.arrayBuffer()))
      .catch((err) => {
        pending = null;
        throw err;
      });
    // Every real consumer asks within the first moments of the page. Past that,
    // drop the 8.8 MB rather than hold it for the session — a late caller
    // re-reads it from the HTTP cache.
    setTimeout(() => {
      pending = null;
    }, 60_000);
  }
  return pending;
}
