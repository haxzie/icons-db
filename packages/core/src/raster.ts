/**
 * Raster collections.
 *
 * Every other set here is SVG: a `body` of markup that gets recoloured, resized,
 * masked and inlined. A raster set has none of that. Its icons are PNG files in
 * R2, addressed by variant and pixel size, and the only thing the database holds
 * is the name and the metadata around it.
 *
 * The split runs all the way to the UI — recolouring, CSS masks, inline SVG and
 * the framework component snippets are all meaningless for a PNG, so the pages
 * ask `collection.raster` and offer a different set of affordances.
 */

export const RASTER_SIZES = [128, 256, 512, 1024] as const;
export type RasterSize = (typeof RASTER_SIZES)[number];

export const RASTER_VARIANTS = ["rounded", "square"] as const;
export type RasterVariant = (typeof RASTER_VARIANTS)[number];

export const DEFAULT_RASTER_SIZE: RasterSize = 256;
export const DEFAULT_RASTER_VARIANT: RasterVariant = "rounded";

export function isRasterSize(n: unknown): n is RasterSize {
  return RASTER_SIZES.includes(n as RasterSize);
}

export function isRasterVariant(s: unknown): s is RasterVariant {
  return RASTER_VARIANTS.includes(s as RasterVariant);
}

/** R2 key for one rendered PNG. The pipeline writes these and the icon route reads them. */
export function rasterKey(prefix: string, name: string, variant: RasterVariant, size: RasterSize): string {
  return `raster/${prefix}/${variant}/${size}/${name}.png`;
}

export type RasterOpts = { size?: RasterSize; variant?: RasterVariant; download?: boolean };

/** Public URL for one PNG. Defaults are omitted so the common case caches under one key. */
export function rasterUrl(prefix: string, name: string, opts: RasterOpts = {}): string {
  const params = new URLSearchParams();
  if (opts.size && opts.size !== DEFAULT_RASTER_SIZE) params.set("size", String(opts.size));
  if (opts.variant && opts.variant !== DEFAULT_RASTER_VARIANT) params.set("variant", opts.variant);
  if (opts.download) params.set("download", "");
  const q = params.toString();
  return `/api/v1/icon/${prefix}/${name}.png${q ? `?${q}` : ""}`;
}

/**
 * What the icon endpoints return in place of a body for a raster icon.
 *
 * The batched icon store is shared by every grid and panel, and it holds
 * Iconify data for the SVG sets. Rather than teach each call site to ask the
 * collection whether a prefix is raster, the store hands back one of these and
 * the renderer branches on the shape it got.
 */
export type RasterRef = { raster: true; width: number; height: number; png: string };

export function isRasterRef(v: unknown): v is RasterRef {
  return typeof v === "object" && v !== null && (v as RasterRef).raster === true;
}
