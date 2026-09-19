import type { SearchIndexData } from "./types";
import type { SemanticHit } from "./rank";

/**
 * Binary layout of embeddings.bin:
 *   uint32 count, uint32 dims,
 *   float32[count] scales,
 *   int8[count * dims] quantised vectors (value = q * scale)
 * Vectors are L2-normalised before quantisation so dot product == cosine.
 */
export type EmbeddingMatrix = {
  count: number;
  dims: number;
  scales: Float32Array;
  data: Int8Array;
};

export function encodeEmbeddings(vectors: Float32Array[], dims: number): ArrayBuffer {
  const count = vectors.length;
  const headerBytes = 8;
  const buf = new ArrayBuffer(headerBytes + count * 4 + count * dims);
  const view = new DataView(buf);
  view.setUint32(0, count, true);
  view.setUint32(4, dims, true);
  const scales = new Float32Array(buf, headerBytes, count);
  const data = new Int8Array(buf, headerBytes + count * 4, count * dims);
  for (let i = 0; i < count; i++) {
    const v = vectors[i];
    let norm = 0;
    for (let d = 0; d < dims; d++) norm += v[d] * v[d];
    norm = Math.sqrt(norm) || 1;
    let max = 0;
    for (let d = 0; d < dims; d++) max = Math.max(max, Math.abs(v[d] / norm));
    const scale = max / 127 || 1;
    scales[i] = scale;
    for (let d = 0; d < dims; d++) data[i * dims + d] = Math.round(v[d] / norm / scale);
  }
  return buf;
}

export function decodeEmbeddings(buf: ArrayBuffer): EmbeddingMatrix {
  const view = new DataView(buf);
  const count = view.getUint32(0, true);
  const dims = view.getUint32(4, true);
  const scales = new Float32Array(buf.slice(8, 8 + count * 4));
  const data = new Int8Array(buf, 8 + count * 4, count * dims);
  return { count, dims, scales, data };
}

export function normalize(v: Float32Array | number[]): Float32Array {
  const out = Float32Array.from(v);
  let norm = 0;
  for (let i = 0; i < out.length; i++) norm += out[i] * out[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

/** Top-K text ids by cosine similarity (brute force; fine for tens of thousands). */
export function topTexts(
  m: EmbeddingMatrix,
  query: Float32Array,
  k: number,
): { textId: number; score: number }[] {
  const { count, dims, scales, data } = m;
  const scores = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let dot = 0;
    const base = i * dims;
    for (let d = 0; d < dims; d++) dot += data[base + d] * query[d];
    scores[i] = dot * scales[i];
  }
  const idx = Array.from({ length: count }, (_, i) => i);
  idx.sort((a, b) => scores[b] - scores[a]);
  return idx.slice(0, k).map((textId) => ({ textId, score: scores[textId] }));
}

/** Map text -> icon indices so semantic hits expand to concrete icons. */
export function buildTextMap(data: SearchIndexData): Map<number, number[]> {
  const map = new Map<number, number[]>();
  data.icons.forEach((entry, idx) => {
    if (entry.length === 5) return; // aliases resolve through their parent
    let list = map.get(entry[2]);
    if (!list) map.set(entry[2], (list = []));
    list.push(idx);
  });
  return map;
}

export function expandTextHits(
  data: SearchIndexData,
  textMap: Map<number, number[]>,
  hits: { textId: number; score: number }[],
  limit: number,
  minScore = 0,
): SemanticHit[] {
  const out: SemanticHit[] = [];
  for (const h of hits) {
    if (h.score < minScore) break;
    const icons = textMap.get(h.textId);
    if (!icons) continue;
    for (const idx of icons) {
      const entry = data.icons[idx];
      out.push({ idx, prefix: data.prefixes[entry[0]].prefix, name: entry[1], score: h.score });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
