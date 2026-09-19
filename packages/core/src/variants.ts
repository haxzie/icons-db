import type { StyleBucket } from "./types";

/** Style suffixes for sets whose Iconify metadata doesn't declare them. */
export const MANUAL_SUFFIXES: Record<string, Record<string, string>> = {
  tabler: { "": "Outline", filled: "Filled" },
  mdi: { "": "Filled", outline: "Outline" },
  bi: { "": "Outline", fill: "Fill" },
  carbon: { "": "Outline", filled: "Filled" },
  iconoir: { "": "Regular", solid: "Solid" },
  "akar-icons": { "": "Outline", fill: "Fill" },
  majesticons: { "": "Solid", line: "Line" },
  lucide: { "": "Outline" },
  gg: { "": "Outline" },
  "radix-icons": { "": "Outline" },
  "simple-icons": { "": "Brand" },
};

export function resolveSuffixes(
  prefix: string,
  metadataSuffixes: Record<string, string> | undefined,
): Record<string, string> {
  if (metadataSuffixes && Object.keys(metadataSuffixes).length > 0) return metadataSuffixes;
  return MANUAL_SUFFIXES[prefix] ?? { "": "Regular" };
}

function sortedSuffixKeys(suffixes: Record<string, string>): string[] {
  return Object.keys(suffixes)
    .filter((s) => s !== "")
    .sort((a, b) => b.length - a.length);
}

const suffixCache = new Map<Record<string, string>, string[]>();

/** Split an icon name into its family (base name) and style label. */
export function splitVariant(
  name: string,
  suffixes: Record<string, string>,
): { family: string; style: string; suffix: string } {
  let keys = suffixCache.get(suffixes);
  if (!keys) {
    keys = sortedSuffixKeys(suffixes);
    suffixCache.set(suffixes, keys);
  }
  for (const key of keys) {
    if (name.endsWith("-" + key) && name.length > key.length + 1) {
      return { family: name.slice(0, -(key.length + 1)), style: suffixes[key], suffix: key };
    }
  }
  return { family: name, style: suffixes[""] ?? "Regular", suffix: "" };
}

export function styleBucket(style: string): StyleBucket {
  const s = style.toLowerCase();
  if (s.includes("duotone")) return "duotone";
  if (s.includes("thin") || s.includes("light")) return "light";
  if (s.includes("brand") || s.includes("color")) return "color";
  if (
    s.includes("fill") ||
    s.includes("solid") ||
    s.includes("bold") ||
    s.includes("filled")
  )
    return "filled";
  return "outline";
}

/** "shopping-cart-2" -> "shopping cart 2" */
export function humanize(family: string): string {
  return family.replace(/[-_]+/g, " ").trim();
}
