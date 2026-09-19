# IconsDB

Search 90,000+ open source icons from 20 curated sets — instant keyword search plus semantic (natural-language) search, with copy/download as SVG, PNG, React, Vue, Svelte or CSS. Live at **https://iconsdb.haxzie.com**.

## How it works

- **Data** comes from Iconify's per-set `@iconify-json/*` packages. `packages/icon-index` normalises them into
  - D1 rows (icon bodies + metadata) — seeded with `wrangler d1 execute`,
  - a compact client search index (`search-index.json`, ~600 KB gzipped) for instant in-browser keyword search,
  - int8 embeddings (`embeddings.bin`, ~11 MB) of every unique icon name, computed locally with `bge-small-en-v1.5`.
- **Search** is hybrid: the browser runs keyword/prefix search itself; `/api/v1/search` embeds the query with Workers AI (`@cf/baai/bge-small-en-v1.5`), brute-forces cosine similarity over the embeddings in the isolate, and the two lists are blended by `packages/core/src/rank.ts`.
- **Site** is Next.js (App Router) deployed to Cloudflare Workers via `@opennextjs/cloudflare`, with D1 for icon data, KV for the Next incremental cache, and static assets for the index files.

## Layout

```
apps/web             Next.js app + API routes + wrangler config
packages/core        shared types, keyword search, ranking, SVG rendering, code snippets
packages/icon-index  data pipeline (build -> embed -> seed)
```

## Development

```sh
pnpm install
pnpm index:build                      # normalise icon sets -> packages/icon-index/dist
pnpm --filter @icons-db/icon-index embed   # compute embeddings (≈15 s on a laptop)
pnpm dev                              # next dev with remote D1 + Workers AI bindings
```

`apps/web/scripts/sync-data.mjs` copies the pipeline output into `apps/web/public/data` before `dev`/`build`.

## Deploying

```sh
cd apps/web
wrangler d1 migrations apply icons-db --remote
for f in ../../packages/icon-index/dist/seed/*.sql; do wrangler d1 execute icons-db --remote --yes --file="$f"; done
pnpm ship                             # opennextjs-cloudflare build && deploy
```

## Adding an icon set

1. `pnpm --filter @icons-db/icon-index add @iconify-json/<prefix>`
2. Add the prefix (and homepage) to `packages/icon-index/src/collections.ts`; add manual style suffixes to `packages/core/src/variants.ts` if the set's metadata doesn't declare them.
3. Re-run build → embed → seed → deploy.

## API

See https://iconsdb.haxzie.com/api. Icons keep their original licenses (all MIT/Apache-2.0/ISC/CC0, Solar is CC-BY-4.0).
