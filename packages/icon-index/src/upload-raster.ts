/**
 * Push the raster set's PNGs to R2.
 *
 * 4,000 objects, so this runs `wrangler r2 object put` through a small pool
 * rather than one at a time — serially it is well over an hour, mostly spent
 * starting node. `--remote` is required to touch the real bucket; without it
 * wrangler writes to local storage, which is what `--local` here is for.
 *
 *   pnpm app-icons:upload -- --remote          # production
 *   pnpm app-icons:upload -- --local           # miniflare, for dev
 *   pnpm app-icons:upload -- --remote --only youtube,netflix
 *   pnpm app-icons:upload -- --local --sizes 256   # one size, e.g. to fill a dev grid
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rasterFiles } from "./app-icons";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "apps", "web");
const BUCKET = "icons-db-data";
// Remote puts are independent HTTP calls and parallelise cleanly. Local ones all
// contend for miniflare's single SQLite file and fail under concurrency, so they
// go one at a time.
const REMOTE_CONCURRENCY = 12;
const LOCAL_CONCURRENCY = 1;

function run(args: string[]): Promise<{ ok: boolean; err: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["wrangler", ...args], { cwd: WEB, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("close", (code) => resolve({ ok: code === 0, err: err.trim() }));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const remote = argv.includes("--remote");
  const local = argv.includes("--local");
  if (remote === local) {
    console.error("pass exactly one of --remote or --local");
    process.exit(2);
  }
  const listArg = (flag: string): Set<string> | null => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? new Set(argv[i + 1].split(",")) : null;
  };
  const only = listArg("--only");
  const sizes = listArg("--sizes");
  const variants = listArg("--variants");

  let files = await rasterFiles();
  if (only) files = files.filter((f) => only.has(f.name));
  if (sizes) files = files.filter((f) => sizes.has(String(f.size)));
  if (variants) files = files.filter((f) => variants.has(f.variant));
  if (files.length === 0) {
    console.error("nothing to upload");
    process.exit(1);
  }
  console.log(`uploading ${files.length} objects to ${BUCKET} (${remote ? "remote" : "local"})`);

  const queue = [...files];
  let done = 0;
  const failures: string[] = [];
  await Promise.all(
    Array.from({ length: remote ? REMOTE_CONCURRENCY : LOCAL_CONCURRENCY }, async () => {
      for (let f; (f = queue.shift()); ) {
        const { ok, err } = await run([
          "r2",
          "object",
          "put",
          `${BUCKET}/${f.key}`,
          `--file=${f.path}`,
          "--content-type=image/png",
          // Immutable: a given name+variant+size only changes when the whole
          // set is re-harvested, and that writes a new version of everything.
          "--cache-control=public, max-age=31536000, immutable",
          remote ? "--remote" : "--local",
        ]);
        if (!ok) failures.push(`${f.key}: ${err.split("\n").pop() ?? "failed"}`);
        if (++done % 100 === 0) console.log(`${done}/${files.length}`);
      }
    }),
  );

  console.log(`\n${done - failures.length} uploaded, ${failures.length} failed`);
  if (failures.length) {
    console.error(failures.slice(0, 20).join("\n"));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
