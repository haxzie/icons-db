// Composes blog cover images (1600x900 SVG, no text) from icons in our own sets.
// Run: node scripts/build-covers.mjs  → public/blog/covers/<slug>.svg (committed).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SETS = join(here, "..", "..", "..", "packages", "icon-index", "node_modules", "@iconify-json");
const OUT = join(here, "..", "public", "blog", "covers");
const W = 1600;
const H = 900;

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

async function glyph(id, { x, y, size, color = "currentColor", opacity = 1, rotate = 0 }) {
  const { body, w, h } = await icon(id);
  const t = rotate ? ` transform="rotate(${rotate} ${x + size / 2} ${y + size / 2})"` : "";
  return `<g${t} opacity="${opacity}" color="${color}"><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${w} ${h}">${body}</svg></g>`;
}

function seeded(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const tile = (x, y, size, fill, r = size * 0.22, extra = "") => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${fill}" ${extra}/>`;

async function tileWithIcon(id, { x, y, size, bg, fg, pad = 0.26, opacity = 1, rotate = 0, stroke = "" }) {
  const t = rotate ? ` transform="rotate(${rotate} ${x + size / 2} ${y + size / 2})"` : "";
  const g = await glyph(id, { x: x + size * pad, y: y + size * pad, size: size * (1 - pad * 2), color: fg });
  return `<g${t} opacity="${opacity}">${tile(x, y, size, bg, size * 0.24, stroke)}${g}</g>`;
}

function wrap(inner, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>\n`;
}

// ---------------------------------------------------------------- covers

async function introducing() {
  const rnd = seeded("introducing");
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1220"/><stop offset="1" stop-color="#132a4a"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#1a73e8" stop-opacity="0.55"/><stop offset="1" stop-color="#1a73e8" stop-opacity="0"/></radialGradient>
  <radialGradient id="fade" cx="0.5" cy="0.5" r="0.6"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>`;
  let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/><ellipse cx="${W / 2}" cy="${H / 2}" rx="700" ry="420" fill="url(#glow)"/>`;
  // mosaic of icons from many sets
  const pool = [
    "lucide:house", "lucide:heart", "lucide:star", "lucide:bell", "lucide:settings", "lucide:camera", "lucide:map-pin", "lucide:zap",
    "tabler:brand-github", "tabler:rocket", "tabler:palette", "tabler:cloud", "tabler:shopping-cart", "tabler:music",
    "ph:chat-circle-dots-fill", "ph:lightning-fill", "ph:planet-fill", "ph:coffee-fill", "ph:sun-fill", "ph:bookmark-fill",
    "heroicons:sparkles-solid", "heroicons:cursor-arrow-rays-solid", "heroicons:puzzle-piece-solid", "heroicons:globe-alt",
    "material-symbols:favorite-rounded", "material-symbols:auto-awesome-rounded", "material-symbols:rocket-launch-rounded", "material-symbols:pets-rounded",
    "ri:leaf-fill", "ri:gamepad-fill", "ri:flask-fill", "ri:cake-2-fill", "bi:emoji-smile-fill", "bi:airplane-fill", "iconoir:gift", "carbon:idea",
    "fluent-emoji-flat:party-popper", "fluent-emoji-flat:rocket", "fluent-emoji-flat:sparkles", "fluent-emoji-flat:fire", "twemoji:red-heart", "noto:star",
    "logos:react", "logos:figma", "logos:vue", "logos:svelte-icon", "simple-icons:github", "simple-icons:x",
  ];
  const colors = ["#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#c58af9", "#78d9ec", "#ff8bcb", "#ffa657"];
  const cols = 11, rows = 6, cell = 150;
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2;
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = pool[(k * 7 + r) % pool.length];
      k++;
      const size = 84 + rnd() * 24;
      const jx = (rnd() - 0.5) * 30, jy = (rnd() - 0.5) * 30;
      const x = ox + c * cell + (cell - size) / 2 + jx;
      const y = oy + r * cell + (cell - size) / 2 + jy;
      const colorful = id.startsWith("fluent-emoji") || id.startsWith("twemoji") || id.startsWith("noto") || id.startsWith("logos");
      const fg = colorful ? "currentColor" : colors[(k + r) % colors.length];
      out += await tileWithIcon(id, { x, y, size, bg: "rgba(255,255,255,0.06)", fg, rotate: (rnd() - 0.5) * 10, stroke: 'stroke="rgba(255,255,255,0.12)"' });
    }
  }
  out += `<rect width="${W}" height="${H}" fill="url(#fade)"/>`;
  // search pill
  const pw = 760, ph = 132, px = (W - pw) / 2, py = (H - ph) / 2;
  out += `<rect x="${px + 6}" y="${py + 14}" width="${pw}" height="${ph}" rx="66" fill="#000" opacity="0.35"/>`;
  out += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="66" fill="#ffffff"/>`;
  out += await glyph("lucide:search", { x: px + 40, y: py + 36, size: 60, color: "#5f6368" });
  out += `<rect x="${px + 130}" y="${py + 52}" width="300" height="28" rx="14" fill="#e0e3e7"/><rect x="${px + 130}" y="${py + 52}" width="4" height="28" fill="#1a73e8"/>`;
  out += `<rect x="${px + pw - 190}" y="${py + 26}" width="160" height="80" rx="40" fill="#1a73e8"/>`;
  out += await glyph("lucide:sparkles", { x: px + pw - 134, y: py + 42, size: 48, color: "#fff" });
  return wrap(out, defs);
}

async function chooseSet() {
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fb"/><stop offset="1" stop-color="#e8f0fe"/></linearGradient>`;
  let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  // three style columns: outline / filled / duotone, same concepts
  const concepts = [
    ["lucide:house", "ph:house-fill", "ph:house-duotone"],
    ["lucide:bell", "ph:bell-fill", "ph:bell-duotone"],
    ["lucide:heart", "ph:heart-fill", "ph:heart-duotone"],
    ["lucide:settings", "ph:gear-fill", "ph:gear-duotone"],
    ["lucide:user", "ph:user-fill", "ph:user-duotone"],
  ];
  const colSpacing = 400, colW = 300, startX = (W - (concepts[0].length * colSpacing - (colSpacing - colW))) / 2;
  const rowH = 136, startY = (H - concepts.length * rowH) / 2 + 10;
  const colColors = ["#1a73e8", "#0b57d0", "#7c4dff"];
  for (let c = 0; c < 3; c++) {
    const x = startX + c * colSpacing;
    const chosen = c === 0;
    out += `<rect x="${x - 30}" y="${startY - 40}" width="${colW + 60}" height="${concepts.length * rowH + 60}" rx="36" fill="#fff" stroke="${chosen ? "#1a73e8" : "#e0e3e7"}" stroke-width="${chosen ? 6 : 2}"/>`;
    for (let r = 0; r < concepts.length; r++) {
      const y = startY + r * rowH;
      out += tile(x, y, 100, chosen ? "#e8f0fe" : "#f1f3f4", 24);
      out += await glyph(concepts[r][c], { x: x + 22, y: y + 22, size: 56, color: colColors[c] });
      // "label" bars
      out += `<rect x="${x + 130}" y="${y + 30}" width="${120 + ((r * 37) % 50)}" height="16" rx="8" fill="#dadce0"/><rect x="${x + 130}" y="${y + 58}" width="80" height="12" rx="6" fill="#e8eaed"/>`;
    }
    if (chosen) {
      out += `<circle cx="${x + colW + 30}" cy="${startY - 40}" r="42" fill="#1a73e8"/>`;
      out += await glyph("lucide:check", { x: x + colW + 30 - 24, y: startY - 40 - 24, size: 48, color: "#fff" });
    }
  }
  return wrap(out, defs);
}

async function licenses() {
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e1"/><stop offset="1" stop-color="#ffe9c2"/></linearGradient>`;
  let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  // faint watermark marks
  const marks = ["lucide:file-badge", "lucide:stamp", "lucide:scroll-text", "lucide:key-round", "lucide:landmark", "lucide:feather", "lucide:gavel", "lucide:book-open-check"];
  const rnd = seeded("licenses");
  for (let i = 0; i < 14; i++) {
    const id = marks[i % marks.length];
    out += await glyph(id, { x: 60 + rnd() * (W - 200), y: 40 + rnd() * (H - 180), size: 70 + rnd() * 50, color: "#c9a44a", opacity: 0.18, rotate: (rnd() - 0.5) * 40 });
  }
  // documents fanned in the back
  const docs = [
    { x: 340, y: 210, r: -8, id: "lucide:file-text", bg: "#fff", fg: "#5f6368" },
    { x: 1080, y: 200, r: 7, id: "lucide:file-check-2", bg: "#fff", fg: "#5f6368" },
  ];
  for (const d of docs) {
    out += `<g transform="rotate(${d.r} ${d.x + 130} ${d.y + 170})"><rect x="${d.x}" y="${d.y}" width="260" height="340" rx="28" fill="${d.bg}" stroke="#e0d5b8" stroke-width="3"/>
      <rect x="${d.x + 40}" y="${d.y + 150}" width="180" height="14" rx="7" fill="#e8eaed"/><rect x="${d.x + 40}" y="${d.y + 184}" width="140" height="14" rx="7" fill="#e8eaed"/><rect x="${d.x + 40}" y="${d.y + 218}" width="160" height="14" rx="7" fill="#e8eaed"/><rect x="${d.x + 40}" y="${d.y + 252}" width="100" height="14" rx="7" fill="#e8eaed"/></g>`;
    out += await glyph(d.id, { x: d.x + 90, y: d.y + 40, size: 80, color: d.fg, rotate: d.r });
  }
  // central scale in a circle
  out += `<circle cx="${W / 2}" cy="${H / 2 + 10}" r="230" fill="#fff" stroke="#f4b400" stroke-width="8"/>`;
  out += await glyph("lucide:scale", { x: W / 2 - 130, y: H / 2 - 120, size: 260, color: "#202124" });
  // licence badges orbiting
  const badges = [
    { id: "simple-icons:creativecommons", fg: "#000", bg: "#fff", x: 470, y: 600 },
    { id: "simple-icons:opensourceinitiative", fg: "#3da639", bg: "#fff", x: 1020, y: 590 },
    { id: "lucide:shield-check", fg: "#fff", bg: "#188038", x: 1040, y: 120 },
    { id: "lucide:badge-check", fg: "#fff", bg: "#1a73e8", x: 420, y: 130 },
    { id: "lucide:copyright", fg: "#fff", bg: "#f4b400", x: 760, y: 720 },
    { id: "lucide:heart-handshake", fg: "#fff", bg: "#d93025", x: 740, y: 60 },
  ];
  for (const b of badges) {
    out += `<circle cx="${b.x + 55}" cy="${b.y + 55}" r="58" fill="${b.bg}" stroke="#fff" stroke-width="6"/>`;
    out += await glyph(b.id, { x: b.x + 22, y: b.y + 22, size: 66, color: b.fg });
  }
  return wrap(out, defs);
}

const COVERS = {
  "introducing-iconsdb": introducing,
  "how-to-choose-an-icon-set": chooseSet,
  "icon-licenses-explained": licenses,
};

await mkdir(OUT, { recursive: true });
for (const [slug, fn] of Object.entries(COVERS)) {
  const svg = await fn();
  await writeFile(join(OUT, `${slug}.svg`), svg);
  console.log(`${slug}.svg ${(svg.length / 1024).toFixed(0)} KB`);
}
