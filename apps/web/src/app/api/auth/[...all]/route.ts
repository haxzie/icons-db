import { getAuth } from "@/lib/auth";
import { withNativeApplicationType } from "@/lib/auth/dcr";

export const dynamic = "force-dynamic";

const REGISTER_PATH = "/api/auth/oauth2/register";

/** See lib/auth/dcr.ts: relabels loopback-only DCR clients as native. */
async function normalizeRegistration(req: Request): Promise<Request> {
  if (req.method !== "POST" || new URL(req.url).pathname !== REGISTER_PATH) return req;
  if (!req.headers.get("content-type")?.includes("application/json")) return req;

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.clone().text());
  } catch {
    return req;
  }

  const patched = withNativeApplicationType(body);
  return patched ? new Request(req, { body: JSON.stringify(patched) }) : req;
}

const handle = async (req: Request) => (await getAuth()).handler(await normalizeRegistration(req));

export { handle as GET, handle as POST, handle as OPTIONS };
