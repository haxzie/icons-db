import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline, env } from "@huggingface/transformers";
import {
  buildKeywordIndex, buildTextMap, decodeEmbeddings, expandTextHits, mergeHits,
  prefixWeight, searchKeyword, topTexts, type SearchIndexData,
} from "@icons-db/core";
import { DIST, MODEL_CACHE } from "./paths";

async function main() {
  env.cacheDir = MODEL_CACHE;
  const data: SearchIndexData = JSON.parse(await readFile(join(DIST, "search-index.json"), "utf8"));
  const texts: string[] = JSON.parse(await readFile(join(DIST, "texts.json"), "utf8"));
  const buf = await readFile(join(DIST, "embeddings.bin"));
  const m = decodeEmbeddings(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const kw = buildKeywordIndex(data);
  const textMap = buildTextMap(data);
  const extractor = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5", { dtype: "fp32" });
  for (const q of process.argv.slice(2)) {
    const t0 = performance.now();
    const k = searchKeyword(kw, q, { limit: 100, prefixWeight });
    const t1 = performance.now();
    const out = await extractor([q], { pooling: "cls", normalize: true });
    const top = topTexts(m, out.data as Float32Array, 12);
    const t2 = performance.now();
    const sem = expandTextHits(data, textMap, top, 100);
    const merged = mergeHits(k, sem, { limit: 12 });
    console.log(`\n"${q}"  keyword ${(t1 - t0).toFixed(1)}ms (${k.length})  semantic ${(t2 - t1).toFixed(1)}ms`);
    console.log("  texts:", top.slice(0, 8).map((h) => `${texts[h.textId]}(${h.score.toFixed(2)})`).join(", "));
    console.log("  merged:", merged.map((h) => `${h.prefix}:${h.name}`).join(", "));
  }
}
main();
