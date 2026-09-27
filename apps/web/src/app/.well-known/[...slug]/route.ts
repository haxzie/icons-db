import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// RFC 8414 / RFC 9728 put OAuth discovery at the origin root, while Better Auth
// lives under /api/auth. Its plugins match on the *absolute* pathname in an
// onRequest hook, so the original request is forwarded untouched — rewriting
// the URL would stop them from recognising it.
const FORWARDED = ["oauth-protected-resource", "oauth-authorization-server"];

export async function GET(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  if (!FORWARDED.includes(slug[0])) return new Response("not found", { status: 404 });
  return (await getAuth()).handler(req);
}

export { GET as HEAD };
