/**
 * App Store Top 500 — the one raster set.
 *
 * Everything else in the pipeline normalises SVG into an Iconify set and lets
 * `build.ts` walk it. This set has no SVG to normalise: the icons are PNGs
 * harvested from Apple's public chart and lookup APIs (see `app-icons/README.md`),
 * so it produces icon records directly, with an empty body and `raster: true`.
 *
 * The PNG blobs are not committed — `app-icons/manifest.json` is the checked-in
 * source of truth, and `fetch.mjs` + `build-png.py` reproduce the pixels from it.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RASTER_SIZES, RASTER_VARIANTS, type CollectionMeta, type IconRecord } from "@icons-db/core";

export const APP_ICONS_PREFIX = "app-icons";

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ICONS_DIR = join(HERE, "..", "app-icons");
export const APP_ICONS_PNG = join(APP_ICONS_DIR, "png");

export type AppEntry = {
  slug: string;
  name: string;
  file: string;
  id: string;
  bundleId: string;
  seller: string;
  genre: string;
  ratings: number;
  rating: number | null;
  chartRank: number | null;
  storeUrl: string;
  artwork: string;
};

type Manifest = { country: string; size: number; generatedAt: string; count: number; apps: AppEntry[] };

export async function loadManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(join(APP_ICONS_DIR, "manifest.json"), "utf8")) as Manifest;
}

/**
 * Icon records for the set.
 *
 * `body` is empty by design — the artwork is in R2, keyed by name — and the
 * geometry columns carry the source artwork's 1024px square so anything that
 * reasons about aspect ratio still gets a true answer.
 */
export async function loadAppIcons(): Promise<{ collection: CollectionMeta; icons: IconRecord[] }> {
  const manifest = await loadManifest();
  const icons: IconRecord[] = manifest.apps.map((app) => ({
    id: `${APP_ICONS_PREFIX}:${app.slug}`,
    prefix: APP_ICONS_PREFIX,
    name: app.slug,
    body: "",
    width: 1024,
    height: 1024,
    left: 0,
    top: 0,
    rotate: 0,
    hFlip: false,
    vFlip: false,
    // One icon per app, so family is the name and there are no style variants.
    family: app.slug,
    style: "Regular",
    category: app.genre,
    aliases: [],
    animated: false,
    raster: true,
  }));

  const genres = [...new Set(manifest.apps.map((a) => a.genre))].sort();
  const collection: CollectionMeta = {
    prefix: APP_ICONS_PREFIX,
    name: "App Store Top 500",
    kind: "apps",
    total: icons.length,
    author: { name: "App publishers", url: "https://www.apple.com/app-store/" },
    license: {
      // Not a licence in the sense every other row here means it. Spelled out
      // rather than left "Unknown" so the badge cannot read as permissive.
      title: "Trademarks of their owners",
      url: "/licenses#app-icons",
      attribution: true,
    },
    homepage: "https://www.apple.com/app-store/",
    category: "Brands / Logos",
    palette: true,
    raster: true,
    animated: 0,
    height: 1024,
    samples: ["youtube", "spotify-music-and-podcasts", "instagram", "netflix", "whatsapp-messenger", "uber-rides-eats-hotels"].filter(
      (s) => icons.some((i) => i.name === s),
    ),
    version: manifest.generatedAt.slice(0, 10),
    suffixes: { "": "Regular" },
    categories: genres,
  };

  return { collection, icons };
}

/** Every PNG that should exist in R2, with the source file that produced it. */
export async function rasterFiles(): Promise<
  { key: string; path: string; name: string; variant: string; size: number }[]
> {
  const out: { key: string; path: string; name: string; variant: string; size: number }[] = [];
  for (const variant of RASTER_VARIANTS) {
    for (const size of RASTER_SIZES) {
      const dir = join(APP_ICONS_PNG, variant, String(size));
      let files: string[];
      try {
        files = await readdir(dir);
      } catch {
        throw new Error(`missing ${dir} — run \`pnpm app-icons:png\` first`);
      }
      for (const f of files.filter((f) => f.endsWith(".png"))) {
        const name = f.slice(0, -4);
        out.push({
          key: `raster/${APP_ICONS_PREFIX}/${variant}/${size}/${f}`,
          path: join(dir, f),
          name,
          variant,
          size,
        });
      }
    }
  }
  return out;
}
