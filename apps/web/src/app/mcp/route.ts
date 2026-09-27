import { after } from "next/server";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { rateLimited } from "@/lib/api";
import { registerTools } from "@/lib/mcp/tools";
import { getMcpResource, MCP_SCOPE } from "@/lib/auth";
import { authOrigin } from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/verify-token";
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

  const env = await getEnv();
  const resource = await getMcpResource();
  const issuer = `${authOrigin(env)}/api/auth`;

  if (!bearer) return withCors(challenge(401, "invalid_request", "Authorization required", resource));

  const verified = await verifyAccessToken(env, bearer, {
    issuer,
    resource,
    requiredScopes: [MCP_SCOPE],
  });
  if (!verified.ok) {
    const status = verified.error === "insufficient_scope" ? 403 : 401;
    return withCors(challenge(status, verified.error, verified.description, resource));
  }

  const userId = typeof verified.claims.sub === "string" ? verified.claims.sub : null;
  const clientId = typeof verified.claims.client_id === "string" ? verified.claims.client_id : null;

  // Access tokens are self-contained JWTs, so revoking an app in the profile
  // page can't invalidate one already issued. Checking the grant here is what
  // makes "revoke" take effect immediately.
  if (userId && clientId && !(await hasGrant(env, userId, clientId))) {
    return withCors(challenge(401, "invalid_grant", "Access was revoked by the user", resource));
  }

  const res = await handlerFor(new URL(req.url).origin).fetch(req);
  if (userId) after(recordMcpUsage(userId, clientId));
  return withCors(res);
}

/** RFC 6750 / RFC 9728 challenge pointing clients at the metadata document. */
function challenge(status: number, error: string, description: string, resource: string) {
  const params = [
    `resource_metadata="${new URL(resource).origin}/.well-known/oauth-protected-resource${new URL(resource).pathname}"`,
    `error="${error}"`,
    `error_description="${description}"`,
    `scope="${MCP_SCOPE}"`,
  ].join(", ");
  return new Response(JSON.stringify({ error, error_description: description }), {
    status,
    headers: { "content-type": "application/json", "www-authenticate": `Bearer ${params}` },
  });
}

/** Personal access tokens: resolved against D1, no network hop. */
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
