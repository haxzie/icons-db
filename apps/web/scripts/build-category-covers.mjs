// Composes the library shelf cards' artwork (800x500 SVG, no text) out of icons
// from the very sets each shelf contains — the picture of "Brand logos" is made
// of real logos, "Animated icons" genuinely animates in the card.
//
// Run: node scripts/build-category-covers.mjs → public/library/categories/<slug>.svg (committed).
//
// Shelves live in src/lib/library-categories.ts and their palettes and icon
// pools in src/lib/category-art.ts, shared with the OG image route; the lists
// are matched by slug and the script fails if they drift.
import { mkdir, readFile, writeFile } from "node:fs/promises";
// Imported from source: this script runs on bare node, and @icons-db/core is
// consumed as TypeScript (Next transpiles it) rather than built to a dist.
import { staticFrame } from "../../../packages/core/src/animation.ts";
import { CATEGORY_ART as SHELVES } from "../src/lib/category-art.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SETS = join(here, "..", "..", "..", "packages", "icon-index", "node_modules", "@iconify-json");
const OUT = join(here, "..", "public", "library", "categories");
const W = 800;
const H = 500;

const cache = new Map();
async function icon(id) {
  const [prefix, name] = id.split(":");
  if (!cache.has(prefix)) cache.set(prefix, JSON.parse(await readFile(join(SETS, prefix, "icons.json"), "utf8")));
  const set = cache.get(prefix);
  let data = set.icons[name];
  if (!data && set.aliases?.[name]) data = { ...set.icons[set.aliases[name].parent], ...set.aliases[name] };
  if (!data) throw new Error(`missing icon ${id}`);
  return { body: data.body, w: data.width ?? set.width ?? 24, h: data.height ?? set.height ?? 24 };
}

// Colourful sets carry <linearGradient id="a">, <mask id="b"> and friends. Dropping
// thirty of them into one document makes every `url(#a)` resolve to whichever came
// first, so each body gets its ids rewritten into its own namespace before inlining.
let uid = 0;
function isolate(body) {
  const ns = `c${uid++}`;
  const ids = new Set();
  for (const m of body.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  if (!ids.size) return body;
  // Longest first so renaming "a" cannot corrupt a reference to "ab".
  for (const id of [...ids].sort((x, y) => y.length - x.length)) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body
      .replace(new RegExp(`\\sid="${esc}"`, "g"), ` id="${ns}-${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${ns}-${id})`)
      .replace(new RegExp(`(xlink:href|href)="#${esc}"`, "g"), `$1="#${ns}-${id}"`);
  }
  return body;
}

/**
 * The dominant animated idiom draws itself in from `stroke-dashoffset`, so at
 * any given instant most of a line-md icon is simply not there — a grid of them
 * reads as an empty box. `staticFrame` is what the rest of the codebase uses for
 * exactly this (PNG output, CSS masks): the most legible frame, with the motion
 * taken out. Shelves opt in per icon, so the spinners that loop continuously and
 * are always visible can stay live and genuinely animate inside the card.
 */
async function glyph(id, { x, y, size, color = "currentColor", opacity = 1, rotate = 0, freeze = false }) {
  const raw = await icon(id);
  const { w, h } = raw;
  const body = freeze ? staticFrame(raw.body) : raw.body;
  const t = rotate ? ` transform="rotate(${round(rotate)} ${round(x + size / 2)} ${round(y + size / 2)})"` : "";
  const o = opacity === 1 ? "" : ` opacity="${round(opacity)}"`;
  return `<g${t}${o} color="${color}"><svg x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" viewBox="0 0 ${w} ${h}">${isolate(body)}</svg></g>`;
}

const round = (n) => (typeof n === "number" ? Math.round(n * 100) / 100 : n);

/** A stable pseudo-random stream, so re-running the script produces byte-identical art. */
function seeded(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// No `fill` on the root: icon bodies rely on the SVG default of black for any
// shape that does not set one, and `fill="none"` here would inherit straight
// through and erase them.
function wrap(inner, defs) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>\n`;
}

/**
 * Every shelf gets the same composition so the row reads as one set of cards:
 * a two-stop diagonal wash, a corner glow, and a staggered brick grid of tiles
 * holding the shelf's own icons, fading out towards the bottom where the title
 * sits. What changes between them is the hue and the icons.
 */
async function shelf(slug, { from, to, glow, tile: tileBg, stroke, ink, pool, freeze }) {
  const rnd = seeded(slug);
  const defs =
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>` +
    `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${glow}" stop-opacity="0.55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="${to}" stop-opacity="0"/><stop offset="1" stop-color="${to}" stop-opacity="0.5"/></linearGradient>`;

  let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/><ellipse cx="${W * 0.26}" cy="${H * 0.2}" rx="${W * 0.6}" ry="${H * 0.7}" fill="url(#glow)"/>`;

  const cell = 128;
  const cols = Math.ceil(W / cell) + 1;
  const rows = Math.ceil(H / cell) + 1;
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = pool[k % pool.length];
      k++;
      const size = 62 + rnd() * 18;
      // Brick offset on alternate rows, plus a little jitter, so the grid never
      // resolves into columns the eye can lock onto.
      const x = c * cell - (r % 2 ? cell * 0.5 : 0) - 40 + (cell - size) / 2 + (rnd() - 0.5) * 22;
      const y = r * cell - 46 + (cell - size) / 2 + (rnd() - 0.5) * 22;
      const rotate = (rnd() - 0.5) * 14;
      const pad = size * 0.2;
      const box = size + pad * 2;
      out +=
        `<g transform="rotate(${round(rotate)} ${round(x + size / 2)} ${round(y + size / 2)})">` +
        `<rect x="${round(x - pad)}" y="${round(y - pad)}" width="${round(box)}" height="${round(box)}" rx="${round(box * 0.28)}" fill="${tileBg}" stroke="${stroke}"/>` +
        (await glyph(id, { x, y, size, color: ink, freeze: freeze?.(id) })) +
        `</g>`;
    }
  }
  out += `<rect width="${W}" height="${H}" fill="url(#scrim)"/>`;
  return wrap(out, defs);
}


// The shelves are the source of truth for which covers must exist.
const source = await readFile(join(here, "..", "src", "lib", "library-categories.ts"), "utf8");
const slugs = [...source.matchAll(/^\s{4}slug: "([^"]+)",$/gm)].map((m) => m[1]);
if (!slugs.length) throw new Error("could not read shelf slugs from library-categories.ts");
const drift = [...slugs.filter((s) => !SHELVES[s]).map((s) => `no art for "${s}"`), ...Object.keys(SHELVES).filter((s) => !slugs.includes(s)).map((s) => `art for unknown shelf "${s}"`)];
if (drift.length) throw new Error(drift.join("; "));

await mkdir(OUT, { recursive: true });
for (const slug of slugs) {
  const svg = await shelf(slug, SHELVES[slug]);
  await writeFile(join(OUT, `${slug}.svg`), svg);
  console.log(`${slug}.svg ${(svg.length / 1024).toFixed(0)} KB`);
}
