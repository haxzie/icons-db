/// <reference lib="webworker" />
// Owns the sentence encoder and the quantised embedding index so the main
// thread never blocks on inference. Mirrors apps/web/src/lib/search.server.ts
// but runs entirely in the browser: same model family, same int8 index, no
// round trip to the edge for semantic queries.

import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import {
  buildTextMap,
  decodeEmbeddings,
  expandTextHits,
  normalize,
  topTexts,
  type SearchIndexData,
} from "@icons-db/core";
import type { WorkerRequest, WorkerResponse } from "./semantic-types";

// We only need the WASM CPU backend (the model is 6 layers, WebGPU dispatch
// overhead isn't worth it) so point at the plain onnxruntime-web build
// instead of the heavier "asyncify" one transformers.js defaults to.
{
  const ort = env.backends.onnx!;
  const base = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.versions!.web}/dist/`;
  ort.wasm!.wasmPaths = { mjs: `${base}ort-wasm-simd-threaded.mjs`, wasm: `${base}ort-wasm-simd-threaded.wasm` };
}

// Model files are vendored under public/models (see scripts/fetch-model.mjs)
// so this never depends on huggingface.co at runtime.
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = "/models/";

let encode: FeatureExtractionPipeline | null = null;
let data: SearchIndexData | null = null;
let textMap: Map<number, number[]> | null = null;
let embeddings: ReturnType<typeof decodeEmbeddings> | null = null;

// People retype the same things; a query vector is ~1.5KB so keep plenty.
const queryCache = new Map<string, Float32Array>();
const CACHE_LIMIT = 500;

const post = (msg: WorkerResponse) => self.postMessage(msg);

async function init(req: Extract<WorkerRequest, { type: "init" }>) {
  try {
    const [dataRes, embRes, pipe] = await Promise.all([
      fetch(req.dataUrl).then((r) => {
        if (!r.ok) throw new Error(`index fetch failed: ${r.status}`);
        return r.json() as Promise<SearchIndexData>;
      }),
      fetch(req.embeddingsUrl).then((r) => {
        if (!r.ok) throw new Error(`embeddings fetch failed: ${r.status}`);
        return r.arrayBuffer();
      }),
      pipeline("feature-extraction", req.model, {
        dtype: "q8", // quantised weights keep the download small (~30MB vs ~130MB fp32)
        progress_callback: (info) => {
          if (info.status === "progress_total") {
            post({ type: "status", state: "loading", progress: info.progress });
          }
        },
      }),
    ]);
    data = dataRes;
    textMap = buildTextMap(data);
    embeddings = decodeEmbeddings(embRes);
    encode = pipe;
    // Warm the graph so the first real keystroke isn't the slow one.
    await embed("hello");
    post({ type: "status", state: "ready" });
  } catch (err) {
    post({ type: "status", state: "error", message: err instanceof Error ? err.message : String(err) });
  }
}

async function embed(query: string): Promise<Float32Array> {
  const cached = queryCache.get(query);
  if (cached) return cached;
  // pooling: "cls" matches packages/icon-index/src/embed.ts, which built the
  // index vectors this scores against; bge models are trained around CLS.
  const out = await encode!(query, { pooling: "cls", normalize: true });
  const vec = normalize(out.data as Float32Array);
  if (queryCache.size >= CACHE_LIMIT) {
    queryCache.delete(queryCache.keys().next().value!);
  }
  queryCache.set(query, vec);
  return vec;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.type === "init") return init(req);
  if (req.type === "search") {
    if (!encode || !data || !textMap || !embeddings) return;
    const t0 = performance.now();
    const vec = await embed(req.query);
    const texts = topTexts(embeddings, vec, 60);
    const floor = Math.max(0.72, (texts[0]?.score ?? 0) - 0.22);
    const hits = expandTextHits(data, textMap, texts, req.limit, floor);
    post({ type: "result", id: req.id, hits, ms: performance.now() - t0 });
  }
};
