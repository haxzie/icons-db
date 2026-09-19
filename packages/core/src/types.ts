export type License = {
  title: string;
  spdx?: string;
  url?: string;
  attribution: boolean;
};

export type CollectionMeta = {
  prefix: string;
  name: string;
  total: number;
  author: { name: string; url?: string };
  license: License;
  homepage?: string;
  category?: string;
  palette: boolean;
  height?: number;
  samples: string[];
  version?: string;
  /** Style suffixes, e.g. { "": "Regular", "fill": "Fill" } */
  suffixes: Record<string, string>;
};

export type StyleBucket = "outline" | "filled" | "duotone" | "light" | "color";

/**
 * Tuple: [prefixIndex, name, textId, categoryIndex, parentIconIndex?]
 * categoryIndex is -1 when unknown; aliases carry a parent as 5th element.
 */
export type IndexIconEntry = [number, string, number, number] | [number, string, number, number, number];

export type SearchIndexData = {
  v: 1;
  prefixes: { prefix: string; name: string; suffixes: Record<string, string> }[];
  categories: string[];
  icons: IndexIconEntry[];
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
};
