// Harvest the top N App Store apps and their icons as PNGs.
//
// Apple exposes the charts without any crawling:
//   1. itunes.apple.com/{cc}/rss/{feed}/limit=200/genre={id}/json  -> ranked app ids
//      (overall charts cap at 100 entries; per-genre charts are disjoint, 100 each,
//       so the 26 genres x 3 feeds reach ~6k candidates for one storefront)
//   2. itunes.apple.com/lookup?id=a,b,c  -> full metadata, 100 ids per call,
//      including artworkUrl512; the mzstatic path accepts any size, so
//      .../512x512bb.jpg -> .../1024x1024bb.png gives a lossless 1024 PNG.
//
// Ranking: chart position is per-genre, so it can't order a global list. We rank by
// userRatingCount (ratings volume = the closest public proxy for install base) and
// keep each app's best chart rank as a tiebreak/metadata.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const COUNTRY = process.env.COUNTRY ?? "us";
const TOP = Number(process.env.TOP ?? 500);
const SIZE = Number(process.env.SIZE ?? 1024);
const DOWNLOAD = Number(process.env.DOWNLOAD ?? TOP); // how many PNGs to actually fetch
const OUT = process.env.OUT ?? new URL("./raw/", import.meta.url).pathname;

const GENRES = {
  6000: "Business", 6001: "Weather", 6002: "Utilities", 6003: "Travel", 6004: "Sports",
  6005: "Social Networking", 6006: "Reference", 6007: "Productivity", 6008: "Photo & Video",
  6009: "News", 6010: "Navigation", 6011: "Music", 6012: "Lifestyle", 6013: "Health & Fitness",
  6014: "Games", 6015: "Finance", 6016: "Entertainment", 6017: "Education", 6018: "Books",
  6020: "Medical", 6021: "Magazines & Newspapers", 6023: "Food & Drink", 6024: "Shopping",
  6026: "Developer Tools", 6027: "Graphics & Design",
};
const FEEDS = ["topfreeapplications", "toppaidapplications", "topgrossingapplications"];

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "iconsdb-app-icon-harvester" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i)); // Apple 504s under burst
    }
  }
}

const slug = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "app";

// --- 1. candidates -----------------------------------------------------------
const ranks = new Map(); // id -> best chart rank seen
for (const feed of FEEDS) {
  for (const genre of ["", ...Object.keys(GENRES)]) {
    const url = `https://itunes.apple.com/${COUNTRY}/rss/${feed}/limit=200${genre ? `/genre=${genre}` : ""}/json`;
    let entries = [];
    try {
      entries = (await getJSON(url)).feed?.entry ?? [];
    } catch (err) {
      console.warn(`skip ${feed} ${genre || "all"}: ${err.message}`);
      continue;
    }
    entries.forEach((e, i) => {
      const id = e.id.attributes["im:id"];
      ranks.set(id, Math.min(ranks.get(id) ?? Infinity, i + 1));
    });
  }
  console.log(`${feed}: ${ranks.size} unique candidates so far`);
}

// --- 2. metadata -------------------------------------------------------------
const ids = [...ranks.keys()];
const apps = [];
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const data = await getJSON(
    `https://itunes.apple.com/lookup?country=${COUNTRY}&id=${batch.join(",")}`,
  );
  for (const r of data.results ?? []) {
    if (r.wrapperType !== "software" || !r.artworkUrl512) continue;
    apps.push({
      id: String(r.trackId),
      bundleId: r.bundleId,
      name: r.trackName,
      slug: slug(r.trackName),
      seller: r.sellerName,
      genre: r.primaryGenreName,
      ratings: r.userRatingCount ?? 0,
      rating: r.averageUserRating ?? null,
      chartRank: ranks.get(String(r.trackId)) ?? null,
      storeUrl: r.trackViewUrl,
      // 512x512bb.jpg -> {SIZE}x{SIZE}bb.png on the same mzstatic thumb path
      artwork: r.artworkUrl512.replace(/\/512x512bb\.(jpg|png)$/, `/${SIZE}x${SIZE}bb.png`),
    });
  }
  console.log(`metadata ${Math.min(i + 100, ids.length)}/${ids.length}`);
}

apps.sort((a, b) => b.ratings - a.ratings);
const top = apps.slice(0, TOP);

// de-dupe slugs (two apps can share a name)
const seen = new Map();
for (const a of top) {
  const n = (seen.get(a.slug) ?? 0) + 1;
  seen.set(a.slug, n);
  if (n > 1) a.slug = `${a.slug}-${n}`;
  a.file = `${a.slug}.png`;
}

await mkdir(OUT, { recursive: true });
await writeFile(
  new URL("./manifest.json", import.meta.url).pathname,
  JSON.stringify(
    { country: COUNTRY, size: SIZE, generatedAt: new Date().toISOString(), count: top.length, apps: top },
    null,
    2,
  ),
);

// --- 3. icons ----------------------------------------------------------------
let ok = 0, failed = 0, bytes = 0;
const queue = top.slice(0, DOWNLOAD);
const workers = Array.from({ length: 8 }, async () => {
  for (let a; (a = queue.shift()); ) {
    try {
      const res = await fetch(a.artwork);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(join(OUT, a.file), buf);
      bytes += buf.length;
      ok++;
    } catch (err) {
      failed++;
      console.warn(`icon ${a.slug}: ${err.message}`);
    }
  }
});
await Promise.all(workers);

console.log(
  `\ncandidates ${ids.length} -> metadata ${apps.length} -> top ${top.length}` +
  `\nicons: ${ok} ok, ${failed} failed, ${(bytes / 1e6).toFixed(1)} MB at ${SIZE}px`,
);
