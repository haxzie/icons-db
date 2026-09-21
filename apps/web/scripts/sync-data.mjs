import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "..", "packages", "icon-index", "dist");
const dest = join(here, "..", "public", "data");
await mkdir(dest, { recursive: true });
for (const f of ["search-index.json", "embeddings.bin", "collections.json", "concepts.json"]) {
  await copyFile(join(src, f), join(dest, f));
}
console.log("synced icon data to public/data");
