// Converts @unlocalhosted/dither-icons (React components, MIT) into an Iconify
// set so the rest of the pipeline can treat it like any @iconify-json package.
//
// All three textures ship: dither (the base name), solid and outline. The dither
// texture is the awkward one — it masks its ink with a 96x96 Bayer field covering
// the whole canvas, which serialises to ~120 KB per icon, twice D1's 64 KB body
// cap. The field only matters where there is ink under it, so we rasterise the
// icon and drop every grain cell that falls on a transparent pixel. That is
// pixel-identical to the full field and roughly a quarter of the bytes.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { cleanupSVG, runSVGO, SVG, IconSet } from "@iconify/tools";
import { DitherIcon, definitions, ditherField } from "@unlocalhosted/dither-icons";
import type { IconifyJSON } from "@iconify/types";
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

/** The rendered markup carries the runtime's animation CSS and hooks; none of it
 * survives into a static body, and cleanupSVG chokes on <style>. */
function staticSvg(name: string, texture: "dither" | "solid" | "outline"): string {
  return renderToStaticMarkup(createElement(DitherIcon, { name, texture, animate: false }))
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/\s(?:class|data-[\w-]+|aria-[\w-]+|role)="[^"]*"/g, "");
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
  let skipped = 0;
  for (const definition of definitions) {
    for (const [texture, suffix] of TEXTURES) {
      const name = suffix ? `${definition.name}-${suffix}` : definition.name;
      try {
        const svg = new SVG(trimField(staticSvg(definition.name, texture)));
        cleanupSVG(svg);
        await runSVGO(svg, { keepShapes: true });
        set.fromSVG(name, svg);
      } catch {
        skipped += 1;
      }
    }
  }
  if (skipped) console.warn(`dither: skipped ${skipped} unrenderable icons`);
  const icons = set.export() as IconifyJSON;
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
