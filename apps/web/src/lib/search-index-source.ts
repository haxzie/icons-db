"use client";

const URL_PATH = "/data/search-index.json";

let pending: Promise<ArrayBuffer> | null = null;

/**
 * The one `/data/search-index.json` response, shared by the grid on the main
 * thread, the keyword-index worker and the semantic worker — which between
 * them used to fetch and re-decompress it three times. <PreloadSearchIndex />
 * has normally had the bytes in flight since the HTML was parsed, so this
 * resolves from the warmed preload entry rather than starting a fresh trip.
 */
export function indexBuffer(): Promise<ArrayBuffer> {
  if (!pending) {
    pending = fetch(URL_PATH)
      .then((r) => {
        if (!r.ok) throw new Error(`index fetch failed: ${r.status}`);
        return r.arrayBuffer();
      })
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
