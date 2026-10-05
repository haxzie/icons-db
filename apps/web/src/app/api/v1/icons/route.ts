import { CACHE_LONG, error, json } from "@/lib/api";
import { getIconsByIds } from "@/lib/db";
import { rasterUrl } from "@icons-db/core";

const ID = /^[a-z0-9-]+:[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** GET /api/v1/icons?ids=lucide:house,tabler:home — raw icon data for up to 200 icons across sets. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = Array.from(new Set((url.searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean)));
  if (ids.length === 0) return error("ids is required");
  if (ids.length > 200) return error("at most 200 ids per request");
  if (ids.some((id) => !ID.test(id))) return error("invalid id");
  const records = await getIconsByIds(ids);
  const icons: Record<string, unknown> = {};
  for (const r of records) {
    if (r.raster) {
      // No body to give: point at the PNG endpoint rather than returning an
      // empty SVG that every consumer would render as a blank box.
      icons[r.id] = { raster: true, width: r.width, height: r.height, png: rasterUrl(r.prefix, r.name) };
      continue;
    }
    icons[r.id] = {
      body: r.body,
      width: r.width,
      height: r.height,
      ...(r.left ? { left: r.left } : {}),
      ...(r.top ? { top: r.top } : {}),
      ...(r.rotate ? { rotate: r.rotate } : {}),
      ...(r.hFlip ? { hFlip: true } : {}),
      ...(r.vFlip ? { vFlip: true } : {}),
    };
  }
  return json({ icons }, { cache: CACHE_LONG });
}
