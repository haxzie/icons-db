import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline, env } from "@huggingface/transformers";
import { encodeEmbeddings } from "@icons-db/core";
import { DIST, MODEL_CACHE } from "./paths";

// Same model family as Workers AI's @cf/baai/bge-small-en-v1.5 so query vectors match.
const MODEL = "Xenova/bge-small-en-v1.5";
const DIMS = 384;
const BATCH = 128;

async function main() {
  env.cacheDir = MODEL_CACHE;
  const texts: string[] = JSON.parse(await readFile(join(DIST, "texts.json"), "utf8"));
  console.log(`embedding ${texts.length} texts with ${MODEL}`);

  const extractor = await pipeline("feature-extraction", MODEL, { dtype: "fp32" });
  const vectors: Float32Array[] = [];
  const started = Date.now();
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const out = await extractor(batch, { pooling: "cls", normalize: true });
    const flat = out.data as Float32Array;
    for (let j = 0; j < batch.length; j++) {
      vectors.push(flat.slice(j * DIMS, (j + 1) * DIMS));
    }
    if ((i / BATCH) % 20 === 0) {
      const done = Math.min(i + BATCH, texts.length);
      const rate = done / ((Date.now() - started) / 1000);
      console.log(`  ${done}/${texts.length}  (${rate.toFixed(0)}/s)`);
    }
  }
  const buf = encodeEmbeddings(vectors, DIMS);
  await writeFile(join(DIST, "embeddings.bin"), Buffer.from(buf));
  console.log(`wrote embeddings.bin (${(buf.byteLength / 1024 / 1024).toFixed(1)} MB) in ${((Date.now() - started) / 1000).toFixed(0)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
