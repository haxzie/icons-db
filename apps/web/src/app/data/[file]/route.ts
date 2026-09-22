import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Serve the large search index + embeddings from R2 (they exceed the 25 MiB
// static-asset limit). Edge-cached via Cache-Control so R2 is hit rarely; the
// pipeline re-uploads on reindex.
const ALLOWED: Record<string, string> = {
  "embeddings.bin": "application/octet-stream",
  "search-index.json": "application/json",
};

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const contentType = ALLOWED[file];
  if (!contentType) return new Response("not found", { status: 404 });
  const { DATA } = await getEnv();
  const obj = await DATA.get(file);
  if (!obj) return new Response("not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      etag: obj.httpEtag,
    },
  });
}
