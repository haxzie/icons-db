export type License = {
  title: string;
  spdx?: string;
  url?: string;
  attribution: boolean;
  /**
   * Not an open licence at all — no grant, usage limited to identifying the
   * thing depicted. Distinct from `attribution`, which means "open, but credit
   * the author": every site that phrases a licence has to say something else
   * entirely here, and "free for commercial use" would be a lie.
   */
  restricted?: boolean;
  /** Short badge label, for when `title` is a sentence rather than an identifier. */
  badge?: string;
};

export type CollectionKind = "icons" | "emoji" | "brands" | "apps";

export type CollectionMeta = {
  prefix: string;
  name: string;
  kind: CollectionKind;
  total: number;
  author: { name: string; url?: string; /** Full profile URL, e.g. https://x.com/handle */ twitter?: string };
  license: License;
  homepage?: string;
  category?: string;
  palette: boolean;
  /** PNG set rather than SVG: icons live in R2 and carry no body. See `raster.ts`. */
  raster: boolean;
  /** How many icons in the set animate (SMIL/CSS inside the body). */
  animated: number;
  height?: number;
  samples: string[];
  version?: string;
  /** Style suffixes, e.g. { "": "Regular", "fill": "Fill" } */
  suffixes: Record<string, string>;
  /** Category names the set uses, for the library sidebar to reserve space
   * before the search index (which is what actually filters) has loaded.
   * Only the pipeline's collections.json carries it; the D1 row has no column
   * because nothing server-side reads it. */
  categories?: string[];
};

export type StyleBucket = "outline" | "filled" | "duotone" | "light" | "color";

/**
 * Tuple: [prefixIndex, name, textId, categoryIndex, parentIconIndex?]
 * categoryIndex is -1 when unknown; aliases carry a parent as 5th element.
 */
export type IndexIconEntry = [number, string, number, number] | [number, string, number, number, number];

export type SearchIndexData = {
  v: 1;
  prefixes: { prefix: string; name: string; suffixes: Record<string, string>; raster?: boolean }[];
  categories: string[];
  icons: IndexIconEntry[];
  /** Indices into `icons` that animate. Sparse enough (~1% of icons) to be much
   * smaller as a list than a sixth tuple slot on every entry. Only canonical
   * entries are listed; aliases resolve through their parent before filtering.
   * Optional so a cached index from an older build still parses. */
  animated?: number[];
};

export function entryParent(e: IndexIconEntry): number | undefined {
  return e.length === 5 ? e[4] : undefined;
}

export type IconRef = {
  prefix: string;
  name: string;
};

export type IconHit = IconRef & {
  score: number;
  /** index into SearchIndexData.icons */
  idx: number;
};

export type IconRecord = {
  id: string;
  prefix: string;
  name: string;
  body: string;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: number;
  hFlip: boolean;
  vFlip: boolean;
  family: string;
  style: string;
  category: string | null;
  aliases: string[];
  animated: boolean;
  /** PNG icon: `body` is empty and the artwork is served from R2. */
  raster: boolean;
};
