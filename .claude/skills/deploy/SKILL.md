---
name: deploy
description: How to deploy IconsDB (iconsdb.app) — the pnpm/Turborepo + Next.js app on Cloudflare Workers via OpenNext. Use when shipping changes, adding icon sets, reseeding D1, uploading the search index to R2, or debugging a failed deploy.
---

# Deploying IconsDB

IconsDB is `apps/web` (Next.js 16 App Router) deployed to **Cloudflare Workers** via
`@opennextjs/cloudflare`, in a pnpm + Turborepo monorepo. Production is **https://iconsdb.app**.

## TL;DR — normal code change

Deploys are **automatic on push to `main`** via GitHub Actions.

```bash
git push origin <branch>:main        # or merge to main
```

CI (`.github/workflows/deploy.yml`) runs: install → rebuild icon index + embeddings →
typecheck/lint/test → `opennextjs-cloudflare build` → deploy → smoke-test. Watch it:

```bash
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')" --exit-status
```

There is **no auto-deploy from the Cloudflare dashboard** (no Workers Builds). CI is the only
automated path. A manual deploy from a laptop is `pnpm ship` (in `apps/web`, needs an authed
wrangler), but prefer CI.

> Note on git remote: SSH to github.com over port 22 has been flaky from this network. If
> `git push origin …` hangs, push over HTTPS with the gh credential helper:
> `git -c credential.helper='!gh auth git-credential' push https://github.com/haxzie/icons-db.git <branch>:main`

## The data stores (know which a change touches)

| Store | Holds | Changes when | How it ships |
|---|---|---|---|
| **D1** (`icons-db`) | icon bodies + metadata (206k+ rows) | you add/remove an icon set | **manual seed** (below) |
| **R2** (`icons-db-data`) | `embeddings.bin`, `search-index.json` (too big for the 25 MiB static-asset limit) | you reindex/re-embed | **manual `pnpm data:upload`** |
| **KV** (`NEXT_INC_CACHE_KV`) | OpenNext ISR/page cache | automatically | nothing to do |
| **R2** (`icons-db-avatars`) | user profile pictures, mirrored from GitHub/Google | on sign-up | written at runtime |
| **D1 auth tables** | users, sessions, OAuth clients/tokens, `mcp_usage`, `api_token` | schema changes only | `wrangler d1 migrations apply` |

Code-only changes need none of these steps — just push. The manual steps are **only** when the
icon dataset changes.

## Adding / changing an icon set (full pipeline)

1. `pnpm --filter @icons-db/icon-index add @iconify-json/<prefix>`
2. Register it in `packages/icon-index/src/collections.ts` (`PREFIXES`, `HOMEPAGES`,
   `AUTHOR_TWITTERS` if the author wants the credit, and `KINDS` if it's `emoji`/`brands`).
   Add variant suffixes to `packages/core/src/variants.ts` if the set uses non-standard style
   suffixes, and an npm entry to `packages/core/src/packages.ts` for the MCP.

   **Not on Iconify?** Write a loader that returns a `SetFiles` and branch on it in
   `loadSet()` — see `lobehub.ts` (plain SVG files) and `dither.ts` (React components rendered
   with `react-dom/server`). Supply `info` and `meta.suffixes` by hand there; everything
   downstream is identical.
3. Rebuild the index + embeddings:
   ```bash
   pnpm index:build
   pnpm --filter @icons-db/icon-index embed
   ```
   Watch the log: **`embeddings.bin` must stay under 26,214,400 bytes (25 MiB)** or... it's on
   R2 now so the asset limit no longer blocks deploy, but keep it lean.
4. **Seed D1** with the new set's rows (find the seed files that contain the prefix; retry on
   transient `fetch failed`):
   ```bash
   cd apps/web
   wrangler d1 execute icons-db --remote --yes --file=../../packages/icon-index/dist/seed/collections.sql
   for f in $(grep -l "'<prefix>:" ../../packages/icon-index/dist/seed/icons-*.sql); do
     wrangler d1 execute icons-db --remote --yes --file="$f"
   done
   wrangler d1 execute icons-db --remote --yes --command "SELECT COUNT(*) AS n FROM icons WHERE prefix='<prefix>'"
   ```
   Inserts are `INSERT OR REPLACE`, so re-running is safe. If a statement fails with
   `SQLITE_TOOBIG`, an icon body exceeds D1's limit — the pipeline already skips bodies over
   64 KB, so this is rare.
5. **Upload the index to R2** (serves search everywhere):
   ```bash
   pnpm data:upload        # r2 object put embeddings.bin + search-index.json (--remote)
   ```
6. `node apps/web/scripts/sync-data.mjs` (copies `collections.json` + `concepts.json` into
   `public/data`; the big files are NOT copied — they live on R2), then commit and push. CI
   deploys.

If you migrate the D1 schema, add a file under `apps/web/migrations/` and
`wrangler d1 migrations apply icons-db --remote`.

## Secrets / config CI relies on

- GitHub repo secret `CLOUDFLARE_API_TOKEN` (Workers Scripts, D1, **KV**, **R2**, SSL/zone).
- Secret `CLOUDFLARE_ACCOUNT_ID`, variable `NEXT_PUBLIC_GA_ID` (`G-R6ZDXEJQ8G`).
- Bindings live in `apps/web/wrangler.jsonc`: `DB` (D1), `DATA` + `AVATARS` (R2),
  `NEXT_INC_CACHE_KV`, `AI`, `ASSETS`, `API_RATE_LIMIT`, `EMAIL` (Email Sending), custom domains
  `iconsdb.app` + `www` + `iconsdb.haxzie.com`. Auth secrets are listed under "Auth & the MCP
  OAuth provider" below.
- After changing bindings run `pnpm --filter @icons-db/web cf-typegen` (CI regenerates
  `cloudflare-env.d.ts` before typecheck).

## Auth & the MCP OAuth provider

`/mcp` is an OAuth 2.1 protected resource — unauthenticated calls get a 401 with an RFC 9728
challenge, and MCP clients register themselves (DCR) and walk the browser flow. The provider is
[Better Auth](https://better-auth.com) (`src/lib/auth/`), stored in the same D1 database.

### Required secrets

```bash
cd apps/web
wrangler secret put BETTER_AUTH_SECRET     # openssl rand -base64 32 — signs sessions + OAuth codes
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SLACK_WEBHOOK_URL    # optional: growth notifications
```

Provider callback URLs (set these in the GitHub/Google app consoles):

- `https://iconsdb.app/api/auth/callback/github`
- `https://iconsdb.app/api/auth/callback/google`

**Rotating `BETTER_AUTH_SECRET` invalidates every session and makes the stored JWKS private key
undecryptable.** If you must rotate it, also `DELETE FROM jwks` so a fresh signing key is generated.

### Slack notifications

`SLACK_WEBHOOK_URL` (an incoming webhook) gets two events, posted fire-and-forget so a Slack
outage can never fail a signup or a tool call:

- `:tada: *Name* (email) signed up via email|GitHub|Google` — from the `user.create` database
  hook, so it fires once per account, never on a repeat sign-in.
- `:electric_plug: *Name* (email) connected to <app> MCP` — from an after-hook on
  `/oauth2/consent`, only when the user accepted. A user who re-authorizes the same client posts
  again; that is rare enough to be signal rather than noise.

Leave the variable unset locally (`.dev.vars`) so test signups don't post to the channel.

### Magic-link email

Magic links go out through the Cloudflare Email Sending binding (`EMAIL`), from
`login@iconsdb.app`. The domain has to be onboarded once:

```bash
npx wrangler email sending enable iconsdb.app   # adds DNS records to the zone
npx wrangler email sending list                 # confirm it's listed
```

Until that runs, magic-link sends fail (social sign-in still works). In `next dev` a failed send
prints the link to the console instead.

### Schema changes

The auth tables come from `migrations/0004_auth.sql`, generated with the Better Auth CLI:

```bash
cd apps/web
npx auth@1.7.6 generate --config auth-schema.config.ts --output /tmp/auth-schema.sql -y
wrangler d1 migrations apply icons-db --remote   # note: no --yes flag on this command
```

`auth-schema.config.ts` is a generation-only shim — the real instance is built per-request in
`src/lib/auth/config.ts`, where the D1 binding exists.

### Page layout

Auth pages render without the side rail. That split is done with a `(auth)` route group holding
`sign-in` and `consent`, while each browsing section (`blog/`, `icon/`, `icons/`, `library/`,
`(docs)/`, `(home)/`) has a one-line `layout.tsx` re-exporting `AppChrome`.

It is deliberately **not** one big `(app)` group: putting a segment inside a route group changes
the generated route name for its `opengraph-image.tsx` (e.g. `/blog/[slug]/opengraph-image` →
`/blog/[slug]/opengraph-image-1p5g3f`), which would 404 every OG image URL that page metadata
hardcodes. A new top-level *page* section needs its own `layout.tsx`; route handlers don't.

### Local development

`next dev` proxies D1 to **production** (the binding is `remote: true`), so anything you sign up
with locally lands in the real database — clean up after testing. Copy `.dev.vars.example` to
`.dev.vars` and set `BETTER_AUTH_URL=http://localhost:3000` so cookies aren't `Secure` and OAuth
URLs point at your machine.

### The consent screen

`/consent` shows two overlapping cards: the IconsDB mark and the requesting app. The app icon
comes from `src/lib/auth/client-logos.ts`, which maps well-known MCP clients (Claude Code, Cursor,
Copilot, VS Code, Codex, Windsurf, Gemini, Zed, Cline, Warp, JetBrains, …) to icons from our own
sets — a registered `logo_uri` is only the fallback for apps we don't recognise, and the app's
initial is the last resort. Adding a client means one line in `PRESETS` plus a check that the icon
id exists in D1.

### Profile page & personal access tokens

`/profile` (linked from the rail avatar) shows the user's details plus two tabs:

- **Connected apps** — OAuth grants, with request counts from `mcp_usage`. Revoking deletes the
  consent row *and* the client's access/refresh tokens. Better Auth's own
  `/oauth2/delete-consent` only removes the consent row, which would leave the refresh token
  alive, so `revokeGrant` in `src/lib/auth/grants.ts` does the full job.
- **Personal access tokens** — `idb_…` tokens for clients that can only send a static header.
  Only the SHA-256 is stored (`api_token.hash`); the plaintext is shown once at creation.

Because OAuth access tokens are self-contained JWTs, deleting rows can't invalidate one already
issued. The MCP route therefore checks `hasGrant(user, client)` on every OAuth-authenticated
request — that indexed D1 read is what makes "Revoke" effective immediately rather than whenever
the token expires. Don't remove it as an optimization without shortening `accessTokenExpiresIn`.

Personal-token traffic is recorded in `mcp_usage` under the client id
`personal-access-token`.

### Verifying auth after a deploy

```bash
curl -s https://iconsdb.app/.well-known/oauth-protected-resource/mcp | jq
curl -s https://iconsdb.app/.well-known/oauth-authorization-server/api/auth | jq .issuer
# unauthenticated MCP call must be a 401 carrying the challenge
curl -s -o /dev/null -D - -X POST https://iconsdb.app/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | grep -i www-authenticate
```

Who is actually using the MCP:

```bash
wrangler d1 execute icons-db --remote --command \
  'SELECT u.email, SUM(m.requests) n FROM mcp_usage m JOIN "user" u ON u.id=m.user_id GROUP BY 1 ORDER BY n DESC LIMIT 20'
```

## Verifying a deploy

```bash
for u in / /install /library/lucide /icon/lucide/house /icons/home; do
  curl -s -o /dev/null -w "%{http_code} $u\n" "https://iconsdb.app$u"; done
curl -s "https://iconsdb.app/api/v1/search?q=rocket&limit=3"      # search works
curl -s -o /dev/null -w "%{http_code}\n" https://iconsdb.app/data/embeddings.bin   # R2 serving
```

## Failure playbook

- **`Asset too large`**: a file in `apps/web/public/` exceeds 25 MiB. The search index/embeddings
  must go to R2, not `public/data` (see the R2 store above).
- **Deploy `fetch failed` / Cloudflare API error**: transient — re-run the job
  (`gh run rerun <id> --failed`) or `npx opennextjs-cloudflare deploy` again.
- **`Authentication error [code: 10000]` on deploy**: the `CLOUDFLARE_API_TOKEN` is missing a
  permission (e.g. KV or R2). Extend it in the Cloudflare dashboard; the value stays the same.
- **TS errors in CI only** (`Property 'DB'/'DATA' does not exist on CloudflareEnv`, or missing
  `@/generated/posts.json` / `public/data/*.json`): the build must generate data + binding types
  before typecheck — CI runs `sync-data.mjs`, `build-blog.mjs`, and `wrangler types`. Keep those
  steps in the workflow.
- **Local `next dev` "poisoned stub" / Miniflare errors**: dev-only binding-proxy corruption.
  Kill `next dev` + `workerd`, `rm -rf apps/web/.next`, restart. Does not affect production.

## Not automated (by design)

- D1 seeding and R2 upload — only needed on dataset changes.
- The **edge Cache Rule** for `/icon/*`, `/library/*`, `/icons/*` (makes cold-rendered pages
  globally instant on repeat visits) — set in the Cloudflare dashboard: Rules → Cache Rules →
  Eligible for cache + Edge TTL: respect origin. Pages already send `Cache-Control: public,
  s-maxage=…`.
