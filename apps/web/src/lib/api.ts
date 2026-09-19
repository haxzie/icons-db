import { NextResponse } from "next/server";
import { getEnv } from "./env";

export const CACHE_LONG = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800";
export const CACHE_SHORT = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";

export function json(data: unknown, init: { status?: number; cache?: string } = {}) {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers: {
      "Cache-Control": init.cache ?? CACHE_SHORT,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function error(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } },
  );
}

/** Returns a 429 response when the caller is over the per-IP budget, otherwise null. */
export async function rateLimited(req: Request): Promise<NextResponse | null> {
  const env = await getEnv();
  if (!env.API_RATE_LIMIT) return null;
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const { success } = await env.API_RATE_LIMIT.limit({ key: ip });
  return success ? null : error("rate limit exceeded", 429);
}

export const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
