// Converts Sam Herbert's svg-loaders (plain SVG files, MIT) into an Iconify set
// so the rest of the pipeline can treat it like any @iconify-json package.
//
// The package ships each loader twice, under `svg-smil-loaders/` and
// `svg-css-loaders/`. Only the SMIL cut comes across. The CSS cut animates
// through a `<style>` block of bare element selectors — `g { animation: ... }`,
// `circle { stroke: #fff }` — which would restyle every `<g>` and `<circle>` on
// any page that inlined the body. Scoping it is possible (see `dither-motion.ts`
// for the machinery) but it would buy one icon the SMIL cut lacks, so it does
// not earn the pass.
//
// The one thing that does need rewriting is colour: these are from 2014, drawn
// white for a dark demo page, with the fill hardcoded on the root or a group.
// `parseColors` moves every one of them to `currentColor`, gradient stops
// included, so they inherit like every other icon in the index. SVGO is skipped
// for the same reason as in `agent-loaders.ts` — the passes that tidy markup are
// the passes that collapse the groups SMIL is attached to.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { cleanupSVG, isEmptyColor, parseColors, SVG, IconSet } from "@iconify/tools";
import type { IconifyJSON } from "@iconify/types";
import type { SetFiles } from "./build";

const require = createRequire(import.meta.url);

export const SVG_LOADERS_PREFIX = "svg-loaders";

export async function loadSvgLoaders(): Promise<SetFiles> {
  const root = dirname(require.resolve("svg-loaders/package.json"));
  const version = (JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { version: string }).version;
  const dir = join(root, "svg-smil-loaders");
  const set = new IconSet({ prefix: SVG_LOADERS_PREFIX, icons: {} });
  const files = (await readdir(dir)).filter((f) => f.endsWith(".svg")).sort();
  let skipped = 0;
  for (const file of files) {
    try {
      const svg = new SVG(await readFile(join(dir, file), "utf8"));
      cleanupSVG(svg);
      await parseColors(svg, {
        defaultColor: "currentColor",
        callback: (_attr, colorStr, color) => (!color || isEmptyColor(color) ? colorStr : "currentColor"),
      });
      set.fromSVG(file.slice(0, -4), svg);
    } catch {
      skipped += 1;
    }
  }
  if (skipped) console.warn(`svg-loaders: skipped ${skipped} unparseable svgs`);
  const icons = set.export() as IconifyJSON;
  return {
    icons,
    info: {
      name: "SVG Loaders",
      total: Object.keys(icons.icons).length,
      author: { name: "Sam Herbert", url: "https://github.com/SamHerbert/SVG-Loaders" },
      license: { title: "MIT", spdx: "MIT", url: "https://github.com/SamHerbert/SVG-Loaders/blob/master/LICENSE.md" },
      samples: ["three-dots", "tail-spin", "audio"],
      palette: false,
      category: "UI 24px",
    },
    meta: { suffixes: { "": "Animated" } },
    version,
  };
}
