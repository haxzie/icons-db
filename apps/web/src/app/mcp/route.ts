import { after } from "next/server";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { requireMcpAuth } from "@better-auth/mcp";
import { rateLimited } from "@/lib/api";
import { registerTools } from "@/lib/mcp/tools";
import { getAuth, getMcpResource, MCP_SCOPE } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { hasGrant } from "@/lib/auth/grants";
import { looksLikeApiToken, resolveToken, touchToken } from "@/lib/auth/tokens";
import { recordMcpUsage } from "@/lib/mcp/usage";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version, mcp-session-id, authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  // Without this, browser-based MCP clients can't read the 401 challenge that
  // tells them where to authorize.
  "Access-Control-Expose-Headers": "www-authenticate, mcp-session-id",
};

const handlers = new Map<string, ReturnType<typeof createMcpHandler>>();

function handlerFor(origin: string) {
  let h = handlers.get(origin);
  if (!h) {
    h = createMcpHandler(
      () => {
        const server = new McpServer(
          { name: "iconsdb", version: "1.0.0", title: "IconsDB", websiteUrl: "https://iconsdb.app/mcp" },
          {
            instructions:
              "IconsDB gives coding agents open source icons, logos and emoji as paste-ready code. " +
              "Typical flow: detect_icon_packages(dependencies) → search_icons(query or queries[], package) → get_icon / get_icons(format). " +
              "Prefer one set per UI. Every result carries its licence; CC-BY sets need attribution.",
          },
        );
        registerTools(server, origin);
        return server;
      },
      { responseMode: "json" },
    );
    handlers.set(origin, h);
  }
  return h;
}

function isBrowserNavigation(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  return req.method === "GET" && accept.includes("text/html") && !accept.includes("text/event-stream");
}

async function handle(req: Request) {
  // People paste this URL into a browser; send them to the install guide before
  // any OAuth challenge gets in the way.
  if (isBrowserNavigation(req)) return Response.redirect(new URL("/install", req.url), 302);

  const limited = await rateLimited(req);
  if (limited) return limited;

  // Personal access tokens are the escape hatch for clients that can only send
  // a static header, so they're checked before the OAuth path.
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (looksLikeApiToken(bearer)) return withCors(await serveWithApiToken(req, bearer));

  const auth = await getAuth();
  const guarded = requireMcpAuth(
    auth,
    async (request, claims) => {
      const userId = typeof claims.sub === "string" ? claims.sub : null;
      const clientId = typeof claims.client_id === "string" ? claims.client_id : null;

      // Access tokens are self-contained JWTs, so revoking an app in the profile
      // page can't invalidate one that's already issued. Checking the grant here
      // is what makes "revoke" take effect immediately instead of whenever the
      // token happens to expire.
      if (userId && clientId) {
        const env = await getEnv();
        if (!(await hasGrant(env, userId, clientId))) return revoked();
      }

      const res = await handlerFor(new URL(request.url).origin).fetch(request);
      if (userId) after(recordMcpUsage(userId, clientId));
      return res;
    },
    { resource: await getMcpResource(), requiredScopes: [MCP_SCOPE] },
  );

  // Covers both tool responses and the 401/403 challenges requireMcpAuth raises.
  return withCors(await guarded(req));
}

async function serveWithApiToken(req: Request, token: string) {
  const env = await getEnv();
  const resolved = await resolveToken(env, token);
  if (!resolved) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": `Bearer error="invalid_token", error_description="Unknown or revoked personal access token"`,
      },
    });
  }
  const res = await handlerFor(new URL(req.url).origin).fetch(req);
  after(touchToken(env, resolved.tokenId));
  after(recordMcpUsage(resolved.userId, "personal-access-token"));
  return res;
}

function revoked() {
  return new Response(JSON.stringify({ error: "invalid_grant" }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "www-authenticate": `Bearer error="invalid_grant", error_description="Access was revoked by the user"`,
    },
  });
}

function withCors(res: Response) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
