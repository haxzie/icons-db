import {
  expandTextHits,
  mergeHits,
  normalize,
  prefixWeight,
  searchKeyword,
  splitVariant,
  topTexts,
  type IconHit,
} from "@icons-db/core";
import { getEnv } from "./env";
import { loadSearchIndex } from "./search-index.server";

const EMBED_MODEL = "@cf/baai/bge-small-en-v1.5";

export async function embedQuery(text: string): Promise<Float32Array> {
  const { AI } = await getEnv();
  const res = (await AI.run(EMBED_MODEL, { text: [text] })) as { data: number[][] };
  return normalize(res.data[0]);
}

export type SearchMode = "keyword" | "semantic" | "hybrid";

export async function search(
  origin: string,
  query: string,
  opts: { mode?: SearchMode; limit?: number; prefixes?: string[] } = {},
): Promise<{ hits: IconHit[]; mode: SearchMode }> {
  const mode = opts.mode ?? "hybrid";
  const limit = opts.limit ?? 120;
  const idx = await loadSearchIndex(origin);
  const allow = opts.prefixes?.length ? new Set(opts.prefixes) : null;
  const filter = (h: IconHit) => !allow || allow.has(h.prefix);

  // When restricted to sets, search wide and filter before truncating; otherwise
  // a set whose icons rank below the global cutoff would appear to have no matches.
  const keyword =
    mode === "semantic" ? [] : searchKeyword(idx.keyword, query, { limit: allow ? 5000 : 300, prefixWeight }).filter(filter).slice(0, 300);

  if (mode === "keyword") return { hits: keyword.slice(0, limit), mode };

  let semantic: ReturnType<typeof expandTextHits> = [];
  try {
    const vec = await embedQuery(query);
    const texts = topTexts(idx.embeddings, vec, allow ? 200 : 60);
    // bge cosine scores compress into ~0.6-1.0, so cut relative to the best match.
    const floor = Math.max(0.72, (texts[0]?.score ?? 0) - 0.22);
    semantic = expandTextHits(idx.data, idx.textMap, texts, allow ? 4000 : 400, floor).filter(filter).slice(0, 400);
  } catch (err) {
    console.error("semantic search failed", err);
  }
  if (mode === "semantic") return { hits: semantic.slice(0, limit).map((s) => ({ ...s })), mode };
  return { hits: mergeHits(keyword, semantic, { limit }), mode };
}

/** Concept slugs semantically close to `slug` (for /icons/{concept} cross-links). */
export async function relatedConcepts(origin: string, slug: string, isConcept: (s: string) => boolean, limit = 12): Promise<string[]> {
  const idx = await loadSearchIndex(origin);
  const vec = await embedQuery(slug.replace(/-/g, " "));
  // Wider and looser than search(): we want neighbours *beyond* the exact family.
  const texts = topTexts(idx.embeddings, vec, 300);
  const hits = expandTextHits(idx.data, idx.textMap, texts, 3000, 0.6);
  const suffixes = new Map(idx.data.prefixes.map((p) => [p.prefix, p.suffixes]));
  const score = new Map<string, number>();
  for (const h of hits) {
    const { family } = splitVariant(h.name, suffixes.get(h.prefix) ?? {});
    if (family === slug || !isConcept(family)) continue;
    score.set(family, Math.max(score.get(family) ?? 0, h.score));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([f]) => f);
}
