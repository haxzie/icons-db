import {
  DEFAULT_RASTER_SIZE,
  DEFAULT_RASTER_VARIANT,
  isAnimated,
  isRasterSize,
  isRasterVariant,
  rasterKey,
  renderSVG,
  staticFrame,
  toIconifyIcon,
} from "@icons-db/core";
import { getIcon } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { CACHE_LONG, error, ICON_NAME } from "@/lib/api";

const COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%]+\))$/;

export async function GET(req: Request, ctx: { params: Promise<{ prefix: string; file: string }> }) {
  const { prefix, file } = await ctx.params;
  const m = /^(.+)\.(svg|png)$/.exec(file);
  if (!m || !ICON_NAME.test(m[1])) return error("expected /<name>.svg or /<name>.png", 404);
  const [, name, ext] = m;
  const icon = await getIcon(prefix, name);
  if (!icon) return error("icon not found", 404);

  const url = new URL(req.url);
  const download = url.searchParams.has("download");

  if (icon.raster) {
    // PNG set: the artwork is in R2 and there is no body to render. `.svg` is a
    // hard no rather than a silent fallback — a caller asking for vector needs
    // to know it cannot have one here.
    if (ext !== "png") return error("this set is PNG only; request /<name>.png", 400);
    return servePng(icon.prefix, icon.name, url, download);
  }
  if (ext === "png") {
    // SVG sets render PNG in the browser (it needs a canvas and the caller's
    // colour), so there is nothing to stream.
    return error("this set is SVG; request /<name>.svg", 400);
  }

  const color = url.searchParams.get("color");
  const width = url.searchParams.get("width") ?? url.searchParams.get("size");
  const height = url.searchParams.get("height");
  let svg = renderSVG(toIconifyIcon(icon), {
    color: color && COLOR.test(color) ? color : undefined,
    width: width && /^\d+(\.\d+)?(px|em|rem|%)?$/.test(width) ? width : undefined,
    height: height && /^\d+(\.\d+)?(px|em|rem|%)?$/.test(height) ? height : undefined,
  });
  // `?static` flattens the animation to a still of the drawn icon, for contexts
  // that cannot run SVG animation (CSS masks, some Markdown renderers, print).
  if (url.searchParams.has("static") && isAnimated(svg)) svg = staticFrame(svg);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": CACHE_LONG,
      "Access-Control-Allow-Origin": "*",
      ...(download ? { "Content-Disposition": `attachment; filename="${prefix}-${icon.name}.svg"` } : {}),
    },
  });
}

async function servePng(prefix: string, name: string, url: URL, download: boolean) {
  const sizeParam = Number(url.searchParams.get("size"));
  const size = isRasterSize(sizeParam) ? sizeParam : DEFAULT_RASTER_SIZE;
  const variantParam = url.searchParams.get("variant");
  const variant = isRasterVariant(variantParam) ? variantParam : DEFAULT_RASTER_VARIANT;

  const { DATA } = await getEnv();
  const obj = await DATA.get(rasterKey(prefix, name, variant, size));
  // A row exists but the blob does not: the set was seeded without its upload.
  if (!obj) return error("icon artwork not found", 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": CACHE_LONG,
      "Access-Control-Allow-Origin": "*",
      etag: obj.httpEtag,
      ...(download ? { "Content-Disposition": `attachment; filename="${prefix}-${name}-${variant}-${size}.png"` } : {}),
    },
  });
}
