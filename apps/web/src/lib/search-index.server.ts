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

async function loadData<T>(file: string, origin: string, decode: (r: Response) => Promise<T>): Promise<T> {
  const env = await getEnv();
  // Read straight from the R2 binding when available (no HTTP round trip).
  if (env.DATA && process.env.NODE_ENV !== "development") {
    const obj = await env.DATA.get(file);
    if (obj) return decode(new Response(obj.body));
  }
  const res = await fetch(new URL(`/data/${file}`, origin).toString());
  if (!res.ok) throw new Error(`failed to load ${file}: ${res.status}`);
  return decode(res);
}

/** Loaded once per isolate; ~15MB of index + quantised embeddings. */
export function loadSearchIndex(origin: string): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const [data, embeddings] = await Promise.all([
        loadData("search-index.json", origin, (r) => r.json() as Promise<SearchIndexData>),
        loadData("embeddings.bin", origin, async (r) => decodeEmbeddings(await r.arrayBuffer())),
      ]);
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
