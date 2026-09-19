import type { IconHit } from "./types";

export type SemanticHit = { idx: number; prefix: string; name: string; score: number };

/**
 * Blend keyword and semantic hits into one ranked list.
 * Keyword scores are roughly 0..2.5, semantic (cosine) roughly 0.5..1 — both are
 * normalised to the top hit of their own list before blending so neither dominates.
 */
export function mergeHits(
  keyword: IconHit[],
  semantic: SemanticHit[],
  opts: { limit?: number; semanticWeight?: number } = {},
): IconHit[] {
  const limit = opts.limit ?? 200;
  const sw = opts.semanticWeight ?? 0.9;
  const kMax = keyword[0]?.score ?? 1;
  const sMin = semantic.length ? semantic[semantic.length - 1].score : 0;
  const sMax = semantic[0]?.score ?? 1;
  const sRange = Math.max(sMax - sMin, 1e-6);

  const merged = new Map<number, IconHit>();
  for (const h of keyword) {
    merged.set(h.idx, { ...h, score: h.score / kMax });
  }
  for (const s of semantic) {
    const norm = (s.score - sMin) / sRange;
    const prev = merged.get(s.idx);
    if (prev) prev.score += sw * norm;
    else merged.set(s.idx, { idx: s.idx, prefix: s.prefix, name: s.name, score: sw * norm });
  }
  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Popular, well-maintained sets get a mild boost so they surface first on ties. */
const PREFIX_WEIGHTS: Record<string, number> = {
  lucide: 1.12,
  heroicons: 1.1,
  tabler: 1.1,
  ph: 1.08,
  ri: 1.06,
  "material-symbols": 1.04,
  bi: 1.04,
  iconoir: 1.03,
  ion: 1.02,
  carbon: 1.02,
  "radix-icons": 1.02,
  octicon: 1.02,
  mdi: 1.0,
  fluent: 0.98,
  solar: 0.98,
  "simple-icons": 1.0,
};

export function prefixWeight(prefix: string): number {
  return PREFIX_WEIGHTS[prefix] ?? 1;
}
