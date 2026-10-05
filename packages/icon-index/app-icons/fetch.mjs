// Download artwork for every app already in manifest.json (skips the ~6k-app
// chart+lookup harvest, which only needs re-running when refreshing the ranking).
import { mkdir, writeFile, access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";

const here = dirname(new URL(import.meta.url).pathname);
const SIZE = Number(process.env.SIZE ?? 1024);
const OUT = join(here, process.env.OUT ?? "raw");
const CONCURRENCY = 8;

const manifest = JSON.parse(await readFile(join(here, "manifest.json"), "utf8"));
await mkdir(OUT, { recursive: true });

const queue = [...manifest.apps];
let ok = 0, skipped = 0, failed = 0, bytes = 0;
const fails = [];

async function fetchIcon(app) {
  const dest = join(OUT, app.file);
  try { await access(dest); skipped++; return; } catch {}
  const url = app.artwork.replace(/\/\d+x\d+bb\.png$/, `/${SIZE}x${SIZE}bb.png`);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      bytes += buf.length; ok++;
      return;
    } catch (err) {
      if (attempt === 3) { failed++; fails.push(`${app.slug}: ${err.message}`); return; }
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let a; (a = queue.shift()); ) {
    await fetchIcon(a);
    const done = ok + skipped + failed;
    if (done % 50 === 0) console.log(`${done}/${manifest.apps.length}`);
  }
}));

console.log(`\n${SIZE}px -> ${OUT}`);
console.log(`ok ${ok}, already present ${skipped}, failed ${failed}, ${(bytes / 1e6).toFixed(1)} MB`);
if (fails.length) console.log("failures:\n  " + fails.join("\n  "));
