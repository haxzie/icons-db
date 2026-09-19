import { renderSVG, toIconifyIcon } from "@icons-db/core";
import { getIcon } from "@/lib/db";
import { CACHE_LONG, error, ICON_NAME } from "@/lib/api";

const COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%]+\))$/;

export async function GET(req: Request, ctx: { params: Promise<{ prefix: string; file: string }> }) {
  const { prefix, file } = await ctx.params;
  const m = /^(.+)\.(svg)$/.exec(file);
  if (!m || !ICON_NAME.test(m[1])) return error("expected /<name>.svg", 404);
  const icon = await getIcon(prefix, m[1]);
  if (!icon) return error("icon not found", 404);

  const url = new URL(req.url);
  const color = url.searchParams.get("color");
  const width = url.searchParams.get("width") ?? url.searchParams.get("size");
  const height = url.searchParams.get("height");
  const svg = renderSVG(toIconifyIcon(icon), {
    color: color && COLOR.test(color) ? color : undefined,
    width: width && /^\d+(\.\d+)?(px|em|rem|%)?$/.test(width) ? width : undefined,
    height: height && /^\d+(\.\d+)?(px|em|rem|%)?$/.test(height) ? height : undefined,
  });
  const download = url.searchParams.has("download");
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": CACHE_LONG,
      "Access-Control-Allow-Origin": "*",
      ...(download ? { "Content-Disposition": `attachment; filename="${prefix}-${icon.name}.svg"` } : {}),
    },
  });
}
