import { search, type SearchMode } from "@/lib/search.server";
import { error, json, rateLimited } from "@/lib/api";

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return error("missing q");
  const modeParam = url.searchParams.get("mode") ?? "hybrid";
  const mode: SearchMode = modeParam === "keyword" || modeParam === "semantic" ? modeParam : "hybrid";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 120) || 120, 1), 500);
  const prefixes = (url.searchParams.get("prefixes") ?? "").split(",").filter(Boolean);
  const { hits } = await search(url.origin, q, { mode, limit, prefixes });
  return json({
    query: q,
    mode,
    total: hits.length,
    icons: hits.map((h) => ({ prefix: h.prefix, name: h.name, idx: h.idx, score: Number(h.score.toFixed(4)) })),
  });
}
