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

## The three data stores (know which a change touches)

| Store | Holds | Changes when | How it ships |
|---|---|---|---|
| **D1** (`icons-db`) | icon bodies + metadata (206k+ rows) | you add/remove an icon set | **manual seed** (below) |
| **R2** (`icons-db-data`) | `embeddings.bin`, `search-index.json` (too big for the 25 MiB static-asset limit) | you reindex/re-embed | **manual `pnpm data:upload`** |
| **KV** (`NEXT_INC_CACHE_KV`) | OpenNext ISR/page cache | automatically | nothing to do |

Code-only changes need none of these steps — just push. The manual steps are **only** when the
icon dataset changes.

## Adding / changing an icon set (full pipeline)

1. `pnpm --filter @icons-db/icon-index add @iconify-json/<prefix>`
2. Register it in `packages/icon-index/src/collections.ts` (`PREFIXES`, `HOMEPAGES`, and
   `KINDS` if it's `emoji`/`brands`). Add variant suffixes to `packages/core/src/variants.ts`
   if the set uses non-standard style suffixes, and an npm entry to
   `packages/core/src/packages.ts` for the MCP.
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
- Bindings live in `apps/web/wrangler.jsonc`: `DB` (D1), `DATA` (R2), `NEXT_INC_CACHE_KV`,
  `AI`, `ASSETS`, `API_RATE_LIMIT`, custom domains `iconsdb.app` + `www` + `iconsdb.haxzie.com`.
- After changing bindings run `pnpm --filter @icons-db/web cf-typegen` (CI regenerates
  `cloudflare-env.d.ts` before typecheck).

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
