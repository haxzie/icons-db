import type { CollectionMeta, IconRecord } from "@icons-db/core";
import { getEnv } from "./env";

type IconRow = {
  id: string;
  prefix: string;
  name: string;
  body: string;
  width: number;
  height: number;
  ox: number;
  oy: number;
  rotate: number;
  hflip: number;
  vflip: number;
  family: string;
  style: string;
  category: string | null;
  aliases: string | null;
};

type CollectionRow = {
  prefix: string;
  name: string;
  kind: string;
  total: number;
  author_name: string | null;
  author_url: string | null;
  license_title: string | null;
  license_spdx: string | null;
  license_url: string | null;
  attribution: number;
  homepage: string | null;
  category: string | null;
  palette: number;
  height: number | null;
  samples: string | null;
  version: string | null;
  suffixes: string | null;
};

function toIcon(r: IconRow): IconRecord {
  return {
    id: r.id,
    prefix: r.prefix,
    name: r.name,
    body: r.body,
    width: r.width,
    height: r.height,
    left: r.ox,
    top: r.oy,
    rotate: r.rotate,
    hFlip: r.hflip === 1,
    vFlip: r.vflip === 1,
    family: r.family,
    style: r.style,
    category: r.category,
    aliases: r.aliases ? JSON.parse(r.aliases) : [],
  };
}

function toCollection(r: CollectionRow): CollectionMeta {
  return {
    prefix: r.prefix,
    name: r.name,
    kind: (r.kind as CollectionMeta["kind"]) ?? "icons",
    total: r.total,
    author: { name: r.author_name ?? "", url: r.author_url ?? undefined },
    license: {
      title: r.license_title ?? "Unknown",
      spdx: r.license_spdx ?? undefined,
      url: r.license_url ?? undefined,
      attribution: r.attribution === 1,
    },
    homepage: r.homepage ?? undefined,
    category: r.category ?? undefined,
    palette: r.palette === 1,
    height: r.height ?? undefined,
    samples: r.samples ? JSON.parse(r.samples) : [],
    version: r.version ?? undefined,
    suffixes: r.suffixes ? JSON.parse(r.suffixes) : { "": "Regular" },
  };
}

export async function getIcon(prefix: string, name: string): Promise<IconRecord | null> {
  const { DB } = await getEnv();
  const row = await DB.prepare("SELECT * FROM icons WHERE id = ?1").bind(`${prefix}:${name}`).first<IconRow>();
  if (row) return toIcon(row);
  // fall back to alias lookup
  const alias = await DB.prepare(
    "SELECT * FROM icons WHERE prefix = ?1 AND aliases LIKE ?2 LIMIT 1",
  )
    .bind(prefix, `%"${name}"%`)
    .first<IconRow>();
  return alias ? toIcon(alias) : null;
}

/** Batched body lookup; D1 caps bound params at 100, so chunk. */
export async function getIcons(prefix: string, names: string[]): Promise<IconRecord[]> {
  if (names.length === 0) return [];
  const { DB } = await getEnv();
  const out: IconRecord[] = [];
  for (let i = 0; i < names.length; i += 90) {
    const chunk = names.slice(i, i + 90);
    const placeholders = chunk.map((_, j) => `?${j + 2}`).join(",");
    const { results } = await DB.prepare(
      `SELECT * FROM icons WHERE prefix = ?1 AND name IN (${placeholders})`,
    )
      .bind(prefix, ...chunk)
      .all<IconRow>();
    for (const r of results) out.push(toIcon(r));
  }
  return out;
}

export async function getVariants(prefix: string, family: string): Promise<IconRecord[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    "SELECT * FROM icons WHERE prefix = ?1 AND family = ?2 ORDER BY name",
  )
    .bind(prefix, family)
    .all<IconRow>();
  return results.map(toIcon);
}

export async function getCollections(): Promise<CollectionMeta[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare("SELECT * FROM collections ORDER BY name").all<CollectionRow>();
  return results.map(toCollection);
}

export async function getCollection(prefix: string): Promise<CollectionMeta | null> {
  const { DB } = await getEnv();
  const row = await DB.prepare("SELECT * FROM collections WHERE prefix = ?1").bind(prefix).first<CollectionRow>();
  return row ? toCollection(row) : null;
}

export type IconSummary = Pick<IconRecord, "name" | "family" | "style" | "category">;

export async function listCollectionIcons(
  prefix: string,
  opts: { limit: number; offset: number; category?: string; style?: string },
): Promise<{ icons: IconSummary[]; total: number }> {
  const { DB } = await getEnv();
  const where: string[] = ["prefix = ?1"];
  const binds: unknown[] = [prefix];
  if (opts.category) {
    binds.push(opts.category);
    where.push(`category = ?${binds.length}`);
  }
  if (opts.style) {
    binds.push(opts.style);
    where.push(`style = ?${binds.length}`);
  }
  const w = where.join(" AND ");
  const total = await DB.prepare(`SELECT COUNT(*) AS n FROM icons WHERE ${w}`)
    .bind(...binds)
    .first<{ n: number }>();
  const { results } = await DB.prepare(
    `SELECT name, family, style, category FROM icons WHERE ${w} ORDER BY name LIMIT ?${binds.length + 1} OFFSET ?${binds.length + 2}`,
  )
    .bind(...binds, opts.limit, opts.offset)
    .all<IconSummary>();
  return { icons: results, total: total?.n ?? 0 };
}

export async function getCollectionFacets(prefix: string): Promise<{ categories: string[]; styles: string[] }> {
  const { DB } = await getEnv();
  const cats = await DB.prepare(
    "SELECT DISTINCT category FROM icons WHERE prefix = ?1 AND category IS NOT NULL ORDER BY category",
  )
    .bind(prefix)
    .all<{ category: string }>();
  const styles = await DB.prepare("SELECT DISTINCT style FROM icons WHERE prefix = ?1 ORDER BY style")
    .bind(prefix)
    .all<{ style: string }>();
  return { categories: cats.results.map((r) => r.category), styles: styles.results.map((r) => r.style) };
}

export type IconLink = Pick<IconRecord, "prefix" | "name" | "body" | "width" | "height" | "left" | "top" | "rotate" | "hFlip" | "vFlip">;

const LINK_COLS = "prefix, name, body, width, height, ox, oy, rotate, hflip, vflip";
type LinkRow = Pick<IconRow, "prefix" | "name" | "body" | "width" | "height" | "ox" | "oy" | "rotate" | "hflip" | "vflip">;
const toLink = (r: LinkRow): IconLink => ({
  prefix: r.prefix,
  name: r.name,
  body: r.body,
  width: r.width,
  height: r.height,
  left: r.ox,
  top: r.oy,
  rotate: r.rotate,
  hFlip: r.hflip === 1,
  vFlip: r.vflip === 1,
});

/** Same family name in other sets — the cheapest "similar icons" signal, no embeddings needed. */
export async function getSameFamilyAcrossSets(prefix: string, family: string, limit = 24): Promise<IconLink[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    `SELECT ${LINK_COLS} FROM icons WHERE family = ?1 AND prefix != ?2 GROUP BY prefix ORDER BY prefix LIMIT ?3`,
  )
    .bind(family, prefix, limit)
    .all<LinkRow>();
  return results.map(toLink);
}

export async function getRelatedInSet(prefix: string, family: string, category: string | null, limit = 24): Promise<IconLink[]> {
  const { DB } = await getEnv();
  const stem = family.split("-")[0];
  const stmt = category
    ? DB.prepare(
        `SELECT ${LINK_COLS} FROM icons WHERE prefix = ?1 AND family != ?2 AND (category = ?3 OR family LIKE ?4) GROUP BY family ORDER BY (category = ?3) DESC, name LIMIT ?5`,
      ).bind(prefix, family, category, `${stem}-%`, limit)
    : DB.prepare(
        `SELECT ${LINK_COLS} FROM icons WHERE prefix = ?1 AND family != ?2 AND family LIKE ?3 GROUP BY family ORDER BY name LIMIT ?4`,
      ).bind(prefix, family, `${stem}-%`, limit);
  const { results } = await stmt.all<LinkRow>();
  return results.map(toLink);
}

export async function listCollectionPage(prefix: string, page: number, perPage: number): Promise<{ icons: IconLink[]; total: number }> {
  const { DB } = await getEnv();
  const total = await DB.prepare("SELECT COUNT(*) AS n FROM icons WHERE prefix = ?1").bind(prefix).first<{ n: number }>();
  const { results } = await DB.prepare(`SELECT ${LINK_COLS} FROM icons WHERE prefix = ?1 ORDER BY name LIMIT ?2 OFFSET ?3`)
    .bind(prefix, perPage, (page - 1) * perPage)
    .all<LinkRow>();
  return { icons: results.map(toLink), total: total?.n ?? 0 };
}

export async function listIconNames(prefix: string): Promise<string[]> {
  const { DB } = await getEnv();
  const out: string[] = [];
  let cursor = "";
  // page through in chunks to stay under D1's per-query row cap
  for (;;) {
    const { results } = await DB.prepare("SELECT name FROM icons WHERE prefix = ?1 AND name > ?2 ORDER BY name LIMIT 5000")
      .bind(prefix, cursor)
      .all<{ name: string }>();
    for (const r of results) out.push(r.name);
    if (results.length < 5000) break;
    cursor = results[results.length - 1].name;
  }
  return out;
}

export async function getAliasParent(prefix: string, alias: string): Promise<string | null> {
  const { DB } = await getEnv();
  const row = await DB.prepare("SELECT name FROM icons WHERE prefix = ?1 AND aliases LIKE ?2 LIMIT 1")
    .bind(prefix, `%"${alias}"%`)
    .first<{ name: string }>();
  return row?.name ?? null;
}

export type FamilyInSet = IconLink & { style: string; variants: number };

/** One representative icon per set for a family, with the number of style variants in that set. */
export async function getFamilyAcrossSets(family: string): Promise<FamilyInSet[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    `SELECT ${LINK_COLS}, style, COUNT(*) AS variants, MIN(length(name)) AS shortest
     FROM icons WHERE family = ?1 GROUP BY prefix ORDER BY prefix`,
  )
    .bind(family)
    .all<LinkRow & { style: string; variants: number }>();
  return results.map((r) => ({ ...toLink(r), style: r.style, variants: r.variants }));
}
