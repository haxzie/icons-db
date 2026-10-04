// The one animated set in the index that is ours. Every other collection here
// is somebody else's work normalised; this one exists because the search that
// sends people to IconsDB — "ai thinking icon", "agent loading spinner",
// "streaming text animation" — has no open source answer. The animated sets
// that do exist are generic (svg-spinners' rings and dots, line-md's draw-ons)
// or thematic (meteocons' weather); nothing covers the states an LLM UI
// actually reports: reasoning, calling a tool, reading a file, embedding,
// streaming tokens back.
//
// So the icons are hand-authored SVG under `icons/agent-loaders/`, MIT like the
// rest of this repo, and the loader is deliberately thinner than its
// neighbours: no @iconify/tools pass at all. `cleanupSVG`/`runSVGO` exist to
// tame markup from a designer's export, and every pass that could touch these
// files is one that could also break them — SVGO collapses the groups that
// `animateTransform` rotates and drops attributes it reads as unknown. The
// files are already in body form (a single presentation `<g>`, `currentColor`,
// a 24x24 box), so the body is the file with its `<svg>` wrapper removed.
//
// Conventions for adding one, since nothing downstream enforces them:
//   - 24x24, stroke 1.5, round caps, `currentColor`; filled parts opt in with
//     `fill="currentColor" stroke="none"`.
//   - `repeatCount="indefinite"` — these are status indicators, not transitions.
//   - The resting state is the *finished* icon, and motion modulates it. The
//     poster frame (`staticFrame`, what PNG and CSS masks get) is picked per
//     attribute from the keyframes, so an element that animates opacity .2 -> 1
//     posters at 1 and one that draws in from `stroke-dashoffset` posters at 0.
//     Anything whose base state is blank would poster blank.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { IconifyJSON } from "@iconify/types";
import type { SetFiles } from "./build";

export const AGENT_LOADERS_PREFIX = "agent-loaders";

/** Bump when the icons change — it is what the set page shows as the version. */
const VERSION = "1.0.0";

const ICONS_DIR = fileURLToPath(new URL("../icons/agent-loaders/", import.meta.url));

/** The markup between the `<svg>` tags. These files are authored as bodies. */
function body(svg: string): string {
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>\s*$/.exec(svg);
  if (!inner) throw new Error("no <svg> root");
  return inner[1].replace(/\n\s*/g, "").trim();
}

export async function loadAgentLoaders(): Promise<SetFiles> {
  const files = (await readdir(ICONS_DIR)).filter((f) => f.endsWith(".svg")).sort();
  const icons: IconifyJSON["icons"] = {};
  for (const file of files) {
    icons[file.slice(0, -4)] = { body: body(await readFile(join(ICONS_DIR, file), "utf8")) };
  }
  const total = Object.keys(icons).length;
  if (total === 0) throw new Error("agent-loaders: no icons found");
  return {
    icons: { prefix: AGENT_LOADERS_PREFIX, width: 24, height: 24, icons },
    info: {
      name: "Agent Loaders",
      total,
      author: { name: "IconsDB", url: "https://github.com/haxzie/icons-db" },
      license: { title: "MIT", spdx: "MIT", url: "https://github.com/haxzie/icons-db/blob/main/LICENSE" },
      samples: ["thinking", "streaming-text", "tool-call"],
      height: 24,
      palette: false,
      category: "Thematic",
    },
    meta: { suffixes: { "": "Animated" } },
    version: VERSION,
  };
}
