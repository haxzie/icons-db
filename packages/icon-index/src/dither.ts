// Converts @unlocalhosted/dither-icons (React components, MIT) into an Iconify
// set so the rest of the pipeline can treat it like any @iconify-json package.
//
// All three textures ship: dither (the base name), solid and outline. The dither
// texture is the awkward one — it masks its ink with a 96x96 Bayer field covering
// the whole canvas, which serialises to ~120 KB per icon, twice D1's 64 KB body
// cap. The field only matters where there is ink under it, so we rasterise the
// icon and drop every grain cell that falls on a transparent pixel. That is
// pixel-identical to the full field and roughly a quarter of the bytes.
//
// The icons also animate on hover, through a stylesheet keyed to runtime hooks.
// `dither-motion.ts` rewrites those hooks onto classes and prunes the sheet down
// to the rules one icon needs, so the animation survives into the body; see the
// note there for why it cannot be carried across as-is.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { cleanupSVG, runSVGO, SVG, IconSet } from "@iconify/tools";
import { DitherIcon, definitions, ditherField } from "@unlocalhosted/dither-icons";
import type { IconifyJSON } from "@iconify/types";
import { ICON_CLASS, iconClass, rewriteMarkup, scopeStylesheet } from "./dither-motion";
import type { SetFiles } from "./build";

export const DITHER_PREFIX = "dither";

/** Texture -> icon-name suffix. The base (suffix-less) name is the dither cut. */
const TEXTURES = [
  ["dither", ""],
  ["solid", "solid"],
  ["outline", "outline"],
] as const;

/** The Bayer field is one square per pixel of a 96x96 grid over the 24x24 viewBox.
 * Parse it back into cells rather than recomputing the thresholds, so the split
 * stays correct if upstream retunes the field. */
const GRID = 96;
const FIELD_CELLS = Array.from(ditherField.matchAll(/M([\d.]+) ([\d.]+)h\.25v\.25h-\.25z/g), (m) => ({
  x: Number(m[1]),
  y: Number(m[2]),
  pixel: Math.round(Number(m[2]) * 4) * GRID + Math.round(Number(m[1]) * 4),
}));

/** ".25" / "-.25" / "0" — every delta is a multiple of a quarter unit, so exact. */
function trim(n: number): string {
  return n === 0 ? "0" : String(n).replace(/^(-?)0\./, "$1.");
}

/** The rendered markup, split from the stylesheet that animates it. cleanupSVG
 * chokes on <style>, so the CSS travels separately and is re-attached at the end. */
function render(name: string, texture: "dither" | "solid" | "outline"): { markup: string; css: string } {
  const raw = renderToStaticMarkup(createElement(DitherIcon, { name, texture, animate: true }));
  const css = /<style>([\s\S]*?)<\/style>/.exec(raw)?.[1] ?? "";
  return { markup: rewriteMarkup(raw.replace(/<style>[\s\S]*?<\/style>/g, "")), css };
}

/** @iconify/tools' defaults minus the passes that flatten groups — the animated
 * parts are groups, and collapsing them takes their class hooks with them. */
const SVGO_PLUGINS = [
  "cleanupAttrs",
  "removeComments",
  "removeUselessDefs",
  "removeEditorsNSData",
  "removeEmptyAttrs",
  "removeEmptyContainers",
  "convertColors",
  "convertTransform",
  "removeNonInheritableGroupAttrs",
  "removeUnusedNS",
  "cleanupNumericValues",
  "cleanupListOfValues",
  "sortDefsChildren",
  "sortAttrs",
] as const;

/** D1 rejects bodies over 64 KB; an icon that would blow the cap ships static. */
const MAX_BODY_BYTES = 64 * 1024;

/** Re-attach the pruned stylesheet and the hover target to a cleaned body. */
function withMotion(body: string, css: string, name: string): string {
  if (!css) return body;
  // A stroke-only icon has almost no hit area of its own, so the transparent
  // rect is what makes the whole square respond to the pointer.
  const target = `<rect width="24" height="24" fill="none" stroke="none" pointer-events="all"/>`;
  const wrapped = `<style>${css}</style><g class="${ICON_CLASS} ${iconClass(name)}">${target}${body}</g>`;
  return wrapped.length > MAX_BODY_BYTES ? body : wrapped;
}

/** Alpha channel of the icon drawn with the grain mask disabled, one byte per cell. */
function inkCoverage(svg: string): Uint8Array {
  const unmasked = svg.replace(ditherField, `M0 0h${GRID / 4}v${GRID / 4}h-${GRID / 4}z`);
  const pixels = new Resvg(unmasked, { fitTo: { mode: "width", value: GRID } }).render().pixels;
  const alpha = new Uint8Array(GRID * GRID);
  for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
  return alpha;
}

/** Keep only the grain squares that land on ink. */
function trimField(svg: string): string {
  if (!svg.includes(ditherField)) return svg;
  const alpha = inkCoverage(svg);
  // Relative moves: after `z` the pen is back at the square's origin, so each
  // cell only has to carry its offset from the last one. Roughly a third off a
  // path that is otherwise all absolute two-decimal coordinates.
  let kept = "";
  let x = 0;
  let y = 0;
  for (const cell of FIELD_CELLS) {
    if (!alpha[cell.pixel]) continue;
    const dy = trim(cell.y - y);
    kept += `m${trim(cell.x - x)}${dy.startsWith("-") ? "" : " "}${dy}h.25v.25h-.25z`;
    x = cell.x;
    y = cell.y;
  }
  return svg.replace(ditherField, kept);
}

export async function loadDither(): Promise<SetFiles> {
  // The package only exports ".", so walk up from the resolved entry for its version.
  const pkgPath = fileURLToPath(new URL("../package.json", import.meta.resolve("@unlocalhosted/dither-icons")));
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as { version: string };
  const set = new IconSet({ prefix: DITHER_PREFIX, icons: {} });
  /** icon name -> the stylesheet that animates it and the definition it belongs
   * to, both applied after export (IconSet has no room for either). */
  const motion = new Map<string, { css: string; base: string }>();
  let skipped = 0;
  for (const definition of definitions) {
    for (const [texture, suffix] of TEXTURES) {
      const name = suffix ? `${definition.name}-${suffix}` : definition.name;
      try {
        const { markup, css } = render(definition.name, texture);
        const svg = new SVG(trimField(markup));
        cleanupSVG(svg);
        await runSVGO(svg, { plugins: [...SVGO_PLUGINS] });
        set.fromSVG(name, svg);
        motion.set(name, { css: scopeStylesheet(css, definition.name), base: definition.name });
      } catch {
        skipped += 1;
      }
    }
  }
  if (skipped) console.warn(`dither: skipped ${skipped} unrenderable icons`);
  const icons = set.export() as IconifyJSON;
  let animated = 0;
  for (const [name, icon] of Object.entries(icons.icons)) {
    const m = motion.get(name);
    const body = m ? withMotion(icon.body, m.css, m.base) : icon.body;
    if (body !== icon.body) animated += 1;
    icon.body = body;
  }
  console.log(`dither: ${animated}/${Object.keys(icons.icons).length} icons keep their hover animation`);
  const samples = ["bell", "heart", "sparkles", "download", "lock", "search"].filter((s) => icons.icons[s]);
  return {
    icons,
    info: {
      name: "Dither Icons",
      total: Object.keys(icons.icons).length,
      author: { name: "Vijay K Singh", url: "https://github.com/vijayksingh/dither-icons" },
      license: { title: "MIT", spdx: "MIT", url: "https://github.com/vijayksingh/dither-icons/blob/main/LICENSE" },
      samples,
      height: 24,
      palette: false,
      category: "General",
    },
    meta: { suffixes: { "": "Dither", solid: "Solid", outline: "Outline" } },
    version: pkg.version,
  };
}
