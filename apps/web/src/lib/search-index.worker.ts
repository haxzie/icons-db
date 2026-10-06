/// <reference lib="webworker" />
// Builds the keyword token/posting index off the main thread. The main thread
// still parses `data` itself (it needs the raw arrays for faceting/grid), so
// this worker only shoulders the ~0.5s tokenise + posting-array build and
// transfers the Int32Array buffers back zero-copy. It parses a clone of the
// bytes the main thread already downloaded rather than fetching the index a
// second time.
import { buildKeywordIndex, type SearchIndexData } from "@icons-db/core";

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const data = JSON.parse(new TextDecoder().decode(e.data.buffer)) as SearchIndexData;
    const { tokens, postings } = buildKeywordIndex(data);
    self.postMessage(
      { ok: true, tokens, postings },
      postings.map((p) => p.buffer),
    );
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
