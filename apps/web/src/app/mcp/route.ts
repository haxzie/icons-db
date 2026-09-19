import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { rateLimited } from "@/lib/api";
import { registerTools } from "@/lib/mcp/tools";

export const dynamic = "force-dynamic";

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
  if (isBrowserNavigation(req)) return Response.redirect(new URL("/install", req.url), 302);
  const limited = await rateLimited(req);
  if (limited) return limited;
  const res = await handlerFor(new URL(req.url).origin).fetch(req);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, mcp-protocol-version, mcp-session-id, authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  return res;
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, mcp-protocol-version, mcp-session-id, authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
  });
}
