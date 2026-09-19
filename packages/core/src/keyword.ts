import type { IconHit, SearchIndexData } from "./types";

export type KeywordIndex = {
  data: SearchIndexData;
  tokens: string[];
  postings: Int32Array[];
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function buildKeywordIndex(data: SearchIndexData): KeywordIndex {
  const map = new Map<string, number[]>();
  data.icons.forEach((entry, idx) => {
    const name = entry[1];
    const seen = new Set<string>();
    for (const tok of tokenize(name)) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      let list = map.get(tok);
      if (!list) map.set(tok, (list = []));
      list.push(idx);
    }
    // whole-name token so "arrow-left" beats "arrow-left-circle" for exact queries
    const whole = name.toLowerCase();
    if (!seen.has(whole)) {
      let list = map.get(whole);
      if (!list) map.set(whole, (list = []));
      list.push(idx);
    }
  });
  const tokens = Array.from(map.keys()).sort();
  const postings = tokens.map((t) => Int32Array.from(map.get(t)!));
  return { data, tokens, postings };
}

function lowerBound(tokens: string[], prefix: string): number {
  let lo = 0;
  let hi = tokens.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (tokens[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Icons matching a single query token (prefix match), with best per-icon token score. */
function matchToken(index: KeywordIndex, qtok: string, out: Map<number, number>) {
  const { tokens, postings } = index;
  let i = lowerBound(tokens, qtok);
  while (i < tokens.length && tokens[i].startsWith(qtok)) {
    const exact = tokens[i] === qtok;
    const score = exact ? 1 : 0.6 + 0.4 * (qtok.length / tokens[i].length);
    const list = postings[i];
    for (let k = 0; k < list.length; k++) {
      const idx = list[k];
      const prev = out.get(idx);
      if (prev === undefined || score > prev) out.set(idx, score);
    }
    i++;
  }
}

export type KeywordOptions = {
  limit?: number;
  /** Optional per-prefix weight multiplier (e.g. favour popular sets). */
  prefixWeight?: (prefix: string) => number;
};

export function searchKeyword(
  index: KeywordIndex,
  query: string,
  opts: KeywordOptions = {},
): IconHit[] {
  const qtoks = tokenize(query);
  if (qtoks.length === 0) return [];
  const { data } = index;
  const limit = opts.limit ?? 200;

  let acc: Map<number, number> | null = null;
  for (const qt of qtoks) {
    const m = new Map<number, number>();
    matchToken(index, qt, m);
    if (!acc) {
      acc = m;
    } else {
      const next = new Map<number, number>();
      for (const [idx, s] of acc) {
        const s2 = m.get(idx);
        if (s2 !== undefined) next.set(idx, s + s2);
      }
      acc = next;
    }
    if (acc.size === 0) return [];
  }
  if (!acc) return [];

  const qjoined = qtoks.join("-");
  // Collapse aliases onto their parent, keep best score per canonical icon.
  const best = new Map<number, number>();
  for (const [idx, raw] of acc) {
    const entry = data.icons[idx];
    const canonical = entry.length === 5 ? entry[4] : idx;
    const name = entry[1];
    let score = raw / qtoks.length;
    if (name === qjoined) score += 1;
    else if (name.startsWith(qjoined)) score += 0.4;
    // shorter names are more likely the "primary" icon
    score += 0.15 / (1 + tokenize(name).length);
    if (opts.prefixWeight) score *= opts.prefixWeight(data.prefixes[entry[0]].prefix);
    const prev = best.get(canonical);
    if (prev === undefined || score > prev) best.set(canonical, score);
  }

  const hits: IconHit[] = [];
  for (const [idx, score] of best) {
    const entry = data.icons[idx];
    hits.push({ idx, prefix: data.prefixes[entry[0]].prefix, name: entry[1], score });
  }
  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return hits.slice(0, limit);
}
