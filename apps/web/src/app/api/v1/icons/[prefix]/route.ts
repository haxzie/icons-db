import { getIcons } from "@/lib/db";
import { rasterUrl } from "@icons-db/core";
import { CACHE_LONG, error, json } from "@/lib/api";

export async function GET(req: Request, ctx: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await ctx.params;
  const url = new URL(req.url);
  const names = Array.from(new Set((url.searchParams.get("icons") ?? "").split(",").filter(Boolean))).slice(0, 200);
  if (names.length === 0) return error("missing icons");
  const icons = await getIcons(prefix, names);
  const out: Record<string, unknown> = {};
  for (const i of icons) {
    if (i.raster) {
      out[i.name] = { raster: true, width: i.width, height: i.height, png: rasterUrl(i.prefix, i.name) };
      continue;
    }
    out[i.name] = {
      body: i.body,
      width: i.width,
      height: i.height,
      ...(i.left ? { left: i.left } : {}),
      ...(i.top ? { top: i.top } : {}),
      ...(i.rotate ? { rotate: i.rotate } : {}),
      ...(i.hFlip ? { hFlip: true } : {}),
      ...(i.vFlip ? { vFlip: true } : {}),
    };
  }
  return json({ prefix, icons: out }, { cache: CACHE_LONG });
}
