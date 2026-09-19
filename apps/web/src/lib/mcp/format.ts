import {
  buildSnippets,
  packageImport,
  renderSVG,
  splitVariant,
  styleBucket,
  svgToDataUri,
  toIconifyIcon,
  UNIVERSAL_PACKAGES,
  type CollectionMeta,
  type Framework,
  type IconHit,
  type IconRecord,
  type StyleBucket,
} from "@icons-db/core";
import { collectionByPrefix } from "@/lib/collections";

export const SITE = "https://iconsdb.app";
export const TRADEMARK = "Brand logos are trademarks of their owners; the license covers the SVG only.";

export type Grouped = {
  id: string;
  prefix: string;
  name: string;
  family: string;
  set: string;
  styles: string[];
  license: string;
  attribution: boolean;
  score: number;
};

export type SearchFilters = {
  sets?: string[];
  kind?: CollectionMeta["kind"];
  style?: StyleBucket;
  license?: "permissive" | "no-attribution";
};

export function licenseLabel(c: CollectionMeta): string {
  return c.license.spdx ?? c.license.title;
}

/** Collapse hits to one row per family, applying the same filters the site uses. */
export function groupHits(hits: IconHit[], f: SearchFilters, limit: number): Grouped[] {
  const allow = f.sets?.length ? new Set(f.sets) : null;
  const seen = new Map<string, Grouped>();
  const out: Grouped[] = [];
  for (const h of hits) {
    if (allow && !allow.has(h.prefix)) continue;
    const c = collectionByPrefix.get(h.prefix);
    if (!c) continue;
    if (f.kind && c.kind !== f.kind) continue;
    if (f.license === "no-attribution" && c.license.attribution) continue;
    const v = splitVariant(h.name, c.suffixes);
    if (f.style && styleBucket(v.style, c.palette) !== f.style) continue;
    const key = `${h.prefix}/${v.family}`;
    const prev = seen.get(key);
    if (prev) {
      if (!prev.styles.includes(v.style)) prev.styles.push(v.style);
      continue;
    }
    if (out.length >= limit) continue;
    const g: Grouped = {
      id: `${h.prefix}:${h.name}`,
      prefix: h.prefix,
      name: h.name,
      family: v.family,
      set: c.name,
      styles: [v.style],
      license: licenseLabel(c),
      attribution: c.license.attribution,
      score: h.score,
    };
    seen.set(key, g);
    out.push(g);
  }
  return out;
}

export function groupedLine(g: Grouped): string {
  const styles = g.styles.length > 1 ? ` · ${g.styles.length} styles: ${g.styles.join(", ")}` : g.styles[0] !== "Regular" ? ` · ${g.styles[0]}` : "";
  return `${g.id} — ${g.set}${styles} · ${g.license}${g.attribution ? " (attribution)" : ""}`;
}

export type IconFormat = "react" | "vue" | "svelte" | "solid" | "svg" | "jsx" | "iconify" | "unplugin" | "css" | "data-uri" | "all";

const FRAMEWORK_FORMATS: Record<string, Framework> = { react: "react", vue: "vue", svelte: "svelte", solid: "solid" };

export function codeFor(icon: IconRecord, c: CollectionMeta, format: IconFormat, opts: { color?: string; size?: number; package?: string } = {}): { blocks: { label: string; code: string; note?: string }[]; svg: string } {
  const svg = renderSVG(toIconifyIcon(icon), {
    color: opts.color,
    width: opts.size ? String(opts.size) : "1em",
    height: opts.size ? String(opts.size) : "1em",
  });
  const id = `${icon.prefix}:${icon.name}`;
  const snippets = buildSnippets({ prefix: icon.prefix, name: icon.name, svg, dataUri: svgToDataUri(svg) });
  const byKind = new Map(snippets.map((s) => [s.kind, s]));
  const blocks: { label: string; code: string; note?: string }[] = [];

  const framework = FRAMEWORK_FORMATS[format];
  if (framework) {
    const pkg = packageImport(icon.prefix, icon.name, icon.style, framework, opts.package);
    if (pkg) blocks.push({ label: `${framework} (${pkg.npm})`, code: pkg.code, note: pkg.note });
    blocks.push({ label: `${framework} (${UNIVERSAL_PACKAGES[framework].npm}, any icon)`, code: UNIVERSAL_PACKAGES[framework].render(id) });
    const inline = byKind.get(framework === "solid" || framework === "js" ? "react" : framework);
    if (inline) blocks.push({ label: `${framework} inline (no dependency)`, code: inline.code });
  } else if (format === "jsx") {
    blocks.push({ label: "React inline component", code: byKind.get("react")!.code });
  } else if (format === "svg") {
    blocks.push({ label: "SVG", code: svg });
  } else if (format === "all") {
    for (const fw of ["react", "vue", "svelte"] as Framework[]) {
      const pkg = packageImport(icon.prefix, icon.name, icon.style, fw);
      if (pkg) blocks.push({ label: `${fw} (${pkg.npm})`, code: pkg.code, note: pkg.note });
    }
    for (const s of snippets) blocks.push({ label: s.label, code: s.code });
  } else {
    const s = byKind.get(format as Exclude<IconFormat, Framework | "jsx" | "all">);
    if (s) blocks.push({ label: s.label, code: s.code });
  }
  return { blocks, svg };
}

export function licenseLine(c: CollectionMeta): string {
  return `License: ${licenseLabel(c)} — ${c.license.attribution ? "attribution required" : "free for commercial use, no attribution"}${c.license.url ? ` (${c.license.url})` : ""}`;
}

export function text(t: string) {
  return { content: [{ type: "text" as const, text: t }] };
}
