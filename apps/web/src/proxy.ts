import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "iconsdb.app";
const LEGACY_HOSTS = new Set(["www.iconsdb.app", "iconsdb.haxzie.com"]);

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (LEGACY_HOSTS.has(host)) {
    const url = new URL(req.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  const { pathname } = req.nextUrl;
  if (pathname === "/api" || pathname === "/docs/mcp") {
    const url = req.nextUrl.clone();
    url.pathname = "/install";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Auth, OAuth discovery and the MCP endpoint must reach their handlers with
  // the original host and path intact — a canonical-host redirect mid-OAuth
  // breaks the signed authorization query.
  matcher: ["/((?!_next/static|_next/image|api/auth|\\.well-known|mcp).*)"],
};
