import type { StyleBucket } from "./types";

const SKIN_TONES: Record<string, string> = {
  "": "Default",
  "light-skin-tone": "Light skin tone",
  "medium-light-skin-tone": "Medium-light skin tone",
  "medium-skin-tone": "Medium skin tone",
  "medium-dark-skin-tone": "Medium-dark skin tone",
  "dark-skin-tone": "Dark skin tone",
};

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
  twemoji: SKIN_TONES,
  noto: SKIN_TONES,
  "fluent-emoji-flat": SKIN_TONES,
  "fluent-emoji-high-contrast": SKIN_TONES,
  openmoji: SKIN_TONES,
  "fluent-emoji": SKIN_TONES,
  emojione: SKIN_TONES,
  "streamline-emojis": SKIN_TONES,
  mage: { "": "Outline", fill: "Fill" },
  f7: { "": "Outline", fill: "Fill" },
  jam: { "": "Outline", f: "Filled" },
  devicon: {
    "": "Original",
    original: "Original",
    plain: "Plain",
    line: "Line",
    wordmark: "Wordmark",
    "original-wordmark": "Original wordmark",
    "plain-wordmark": "Plain wordmark",
    "line-wordmark": "Line wordmark",
  },
  "skill-icons": { "": "Default", dark: "Dark", light: "Light" },
  fa6: { "": "Solid" },
  hugeicons: { "": "Stroke" },
  "line-md": { "": "Line" },
  bx: { "": "Regular" },
  bxs: { "": "Solid" },
  bxl: { "": "Logo" },
  uil: { "": "Line" },
  uim: { "": "Monochrome" },
  uis: { "": "Solid" },
  la: { "": "Line" },
  logos: { "": "Color" },
  "vscode-icons": { "": "Color" },
  catppuccin: { "": "Color" },
  "circle-flags": { "": "Circle" },
  ic: { "": "Baseline", baseline: "Baseline", outline: "Outline", round: "Round", sharp: "Sharp", twotone: "Two tone" },
  "fa7-solid": { "": "Solid" },
  "fa7-regular": { "": "Regular" },
  "fa7-brands": { "": "Brand" },
  "icon-park-outline": { "": "Outline" },
  "icon-park-solid": { "": "Solid" },
  "icon-park-twotone": { "": "Two tone" },
  "icon-park": { "": "Color" },
  tdesign: { "": "Outline", filled: "Filled" },
  prime: { "": "Regular", fill: "Fill" },
  ep: { "": "Outline" },
  codicon: { "": "Regular" },
  "lucide-lab": { "": "Outline" },
  "material-icon-theme": { "": "Color" },
  cib: { "": "Brand" },
  token: { "": "Mono" },
  fxemoji: SKIN_TONES,
  flagpack: { "": "Rounded" },
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

export function styleBucket(style: string, palette?: boolean): StyleBucket {
  if (palette) return "color";
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
