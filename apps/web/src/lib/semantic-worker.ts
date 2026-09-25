/// <reference lib="webworker" />
// Owns the sentence encoder and the quantised embedding index so the main
// thread never blocks on inference. Mirrors apps/web/src/lib/search.server.ts
// but runs entirely in the browser: same model family, same int8 index, no
// round trip to the edge for semantic queries.

import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import {
  buildTextMap,
  decodeEmbeddings,
  expandTextHits,
  normalize,
  SEMANTIC_K,
  semanticFloor,
  topTexts,
  type SearchIndexData,
} from "@icons-db/core";
import type { WorkerRequest, WorkerResponse } from "./semantic-types";

type Transformers = typeof import("@huggingface/transformers");

// transformers.js is loaded from a CDN at runtime rather than bundled: its
// onnxruntime wasm (25MB+) and the quantised model (32MB) both exceed the
// 25MiB static-asset limit on Cloudflare Workers. The Function wrapper keeps
// the bundler from trying to resolve the URL.
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js";
const importUrl = new Function("u", "return import(u)") as (u: string) => Promise<Transformers>;

let transformers: Promise<Transformers> | null = null;
function loadTransformers(): Promise<Transformers> {
  if (!transformers) {
    transformers = importUrl(TRANSFORMERS_URL).then((t) => {
      // Only the WASM CPU backend is needed (6-layer model); point at the plain
      // onnxruntime-web build instead of the heavier "asyncify" default.
      const ort = t.env.backends.onnx!;
      const base = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.versions!.web}/dist/`;
      ort.wasm!.wasmPaths = { mjs: `${base}ort-wasm-simd-threaded.mjs`, wasm: `${base}ort-wasm-simd-threaded.wasm` };
      t.env.allowLocalModels = false;
      t.env.allowRemoteModels = true;
      return t;
    });
  }
  return transformers;
}

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
      loadTransformers().then((t) =>
        t.pipeline("feature-extraction", req.model, {
        dtype: "q8", // quantised weights keep the download small (~30MB vs ~130MB fp32)
        progress_callback: (info) => {
          if (info.status === "progress_total") {
            post({ type: "status", state: "loading", progress: info.progress });
          }
        },
        }),
      ),
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
    const texts = topTexts(embeddings, vec, SEMANTIC_K);
    const floor = semanticFloor(texts[0]?.score ?? 0);
    const hits = expandTextHits(data, textMap, texts, req.limit, floor);
    post({ type: "result", id: req.id, hits, ms: performance.now() - t0 });
  }
};
