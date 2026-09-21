// Converts @lobehub/icons-static-svg (plain SVG files, MIT) into an Iconify
// set so the rest of the pipeline can treat it like any @iconify-json package.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { cleanupSVG, runSVGO, SVG, IconSet } from "@iconify/tools";
import type { IconifyJSON } from "@iconify/types";
import type { SetFiles } from "./build";

const require = createRequire(import.meta.url);

export const LOBEHUB_PREFIX = "lobehub";

export async function loadLobehub(): Promise<SetFiles> {
  const dir = join(dirname(require.resolve("@lobehub/icons-static-svg/package.json")), "icons");
  const version = (JSON.parse(await readFile(join(dirname(dir), "package.json"), "utf8")) as { version: string }).version;
  const set = new IconSet({ prefix: LOBEHUB_PREFIX, icons: {} });
  const files = (await readdir(dir)).filter((f) => f.endsWith(".svg")).sort();
  let skipped = 0;
  for (const file of files) {
    const name = file.slice(0, -4);
    try {
      const svg = new SVG(await readFile(join(dir, file), "utf8"));
      cleanupSVG(svg);
      await runSVGO(svg, { keepShapes: true });
      set.fromSVG(name, svg);
    } catch {
      skipped += 1;
    }
  }
  if (skipped) console.warn(`lobehub: skipped ${skipped} unparseable svgs`);
  const icons = set.export() as IconifyJSON;
  const samples = ["openai", "claude-color", "gemini-color", "deepseek-color", "mistral-color", "huggingface-color"].filter((s) => icons.icons[s]);
  return {
    icons,
    info: {
      name: "LobeHub AI Icons",
      total: Object.keys(icons.icons).length,
      author: { name: "LobeHub", url: "https://github.com/lobehub/lobe-icons" },
      license: { title: "MIT", spdx: "MIT", url: "https://github.com/lobehub/lobe-icons/blob/master/LICENSE" },
      samples,
      height: 24,
      palette: false,
      category: "Logos",
    },
    meta: {
      suffixes: { "": "Mono", color: "Color", text: "Wordmark", "text-color": "Wordmark color", "text-cn": "Wordmark (CN)", brand: "Brand", "brand-color": "Brand color" },
    },
    version,
  };
}
