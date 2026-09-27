import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Profile pictures live in a private R2 bucket; this route is their public face.
// Keys are content-addressed (see lib/auth/avatar.ts), so they can be cached hard.
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const { AVATARS } = await getEnv();
  const obj = await AVATARS.get(key.join("/"));
  if (!obj) return new Response("not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      etag: obj.httpEtag,
    },
  });
}
