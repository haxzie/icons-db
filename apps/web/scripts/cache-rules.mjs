#!/usr/bin/env node
/**
 * The edge Cache Rule for iconsdb.app, as code.
 *
 * Why this file exists: the rule used to live only in the Cloudflare dashboard,
 * which is how it came to not exist at all. On 2026-10-28 every route on the zone
 * returned no `cf-cache-status` header -- nothing was edge-cached, so every page
 * view was a Worker invocation and a KV read, and the `s-maxage` values set in
 * next.config.ts did nothing. Cloudflare does not cache HTML without a rule.
 *
 * Why Edge TTL is overridden rather than "respect origin": Next emits
 * `s-maxage=2, stale-while-revalidate=2592000` on /library/:prefix and
 * /icons/:concept. Cloudflare honours stale-while-revalidate only on Enterprise,
 * so respecting the origin would buy a 2-second edge TTL on two of the three
 * highest-volume page types.
 *
 * Safety: the expression is an allow-list of paths that render identically for
 * every visitor. It deliberately does not match /profile, /sign-in, /consent,
 * /api/auth/*, /mcp, /avatars/* or /.well-known/*, all of which are
 * `force-dynamic` and send `private, no-store`.
 *
 *   node scripts/cache-rules.mjs --dry-run   # print what would be sent
 *   node scripts/cache-rules.mjs             # create or update the ruleset
 */
import { execFileSync } from "node:child_process";

const ZONE = "9629fb43e0892395b686438630280c22"; // iconsdb.app
const PHASE = "http_request_cache_settings";
const DAY = 86400;

/** Cacheable because the response is the same for everyone who asks. */
const PUBLIC_PATHS = [
  'starts_with(http.request.uri.path, "/icon/")',
  'starts_with(http.request.uri.path, "/library")',
  'starts_with(http.request.uri.path, "/icons")',
  'starts_with(http.request.uri.path, "/blog")',
  'starts_with(http.request.uri.path, "/sitemaps/")',
  'starts_with(http.request.uri.path, "/data/")',
  'starts_with(http.request.uri.path, "/api/v1/")',
  'http.request.uri.path in {"/" "/install" "/licenses" "/sitemap.xml" "/robots.txt"}',
];

/** Never cache these, whatever the path rules say. */
const NEVER = [
  'starts_with(http.request.uri.path, "/api/v1/search")', // per-query, rate-limited
  'starts_with(http.request.uri.path, "/api/auth/")',
];

const rules = [
  {
    description: "Cache public pages and the icon API at the edge",
    expression: `(${PUBLIC_PATHS.join(" or ")}) and not (${NEVER.join(" or ")})`,
    action: "set_cache_settings",
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "override_origin", default: DAY },
      browser_ttl: { mode: "respect_origin" },
      // /api/v1/icons?ids=... is keyed by its query string, which the default
      // cache key already includes. Ignoring cookies keeps signed-in and
      // signed-out visitors on one cached copy of these shared pages.
      cache_key: { cache_by_device_type: false, ignore_query_strings_order: true },
      origin_error_page_passthru: true,
    },
  },
];

const body = JSON.stringify({ rules });
if (process.argv.includes("--dry-run")) {
  console.log(`zone ${ZONE} phase ${PHASE}`);
  console.log(JSON.stringify({ rules }, null, 2));
  process.exit(0);
}

const out = execFileSync(
  "cf",
  ["rulesets", "account-rulesets", "phases", "update", PHASE, "-z", ZONE, "--rules", body],
  { encoding: "utf8" },
);
console.log(out);
