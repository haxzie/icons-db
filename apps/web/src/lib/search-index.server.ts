import {
  buildKeywordIndex,
  buildTextMap,
  decodeEmbeddings,
  type EmbeddingMatrix,
  type KeywordIndex,
  type SearchIndexData,
} from "@icons-db/core";
import { getEnv } from "./env";

type Loaded = {
  data: SearchIndexData;
  /** Built lazily; the browser does keyword search itself so most requests never need it. */
  readonly keyword: KeywordIndex;
  textMap: Map<number, number[]>;
  embeddings: EmbeddingMatrix;
};

let loading: Promise<Loaded> | null = null;

async function fetchAsset(path: string, origin: string): Promise<Response> {
  const env = await getEnv();
  const url = new URL(path, origin);
  // In `next dev` the ASSETS binding serves the last *build's* .open-next/assets,
  // which goes stale after a data rebuild; hit the dev server for public/ instead.
  if (env.ASSETS && process.env.NODE_ENV !== "development") {
    const res = await env.ASSETS.fetch(new Request(url.toString()));
    if (res.ok) return res;
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return res;
}

/** Loaded once per isolate; ~15MB of index + quantised embeddings. */
export function loadSearchIndex(origin: string): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const [dataRes, embRes] = await Promise.all([
        fetchAsset("/data/search-index.json", origin),
        fetchAsset("/data/embeddings.bin", origin),
      ]);
      const data = (await dataRes.json()) as SearchIndexData;
      const embeddings = decodeEmbeddings(await embRes.arrayBuffer());
      let keyword: KeywordIndex | null = null;
      return {
        data,
        get keyword() {
          return (keyword ??= buildKeywordIndex(data));
        },
        textMap: buildTextMap(data),
        embeddings,
      };
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}
