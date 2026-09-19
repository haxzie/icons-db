import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { parseIconSet } from "@iconify/utils";
import type { IconifyJSON, IconifyMetaData, IconifyInfo } from "@iconify/types";
import {
  humanize,
  resolveSuffixes,
  splitVariant,
  type CollectionMeta,
  type IconRecord,
  type IndexIconEntry,
  type SearchIndexData,
} from "@icons-db/core";
import { HOMEPAGES, KINDS, PREFIXES } from "./collections";
import { DIST } from "./paths";

const require = createRequire(import.meta.url);

type SetFiles = { icons: IconifyJSON; info: IconifyInfo; meta: IconifyMetaData; version: string };

async function loadSet(prefix: string): Promise<SetFiles> {
  const dir = dirname(require.resolve(`@iconify-json/${prefix}/package.json`));
  const read = async (f: string) => JSON.parse(await readFile(join(dir, f), "utf8"));
  let meta: IconifyMetaData = {};
  try {
    meta = await read("metadata.json");
  } catch {
    /* optional */
  }
  return {
    icons: await read("icons.json"),
    info: await read("info.json"),
    meta,
    version: (await read("package.json")).version,
  };
}

const ATTRIBUTION_SPDX = /^CC-BY/i;
// D1 rejects statements over ~100KB, and anything this big is a poor icon anyway.
const MAX_BODY_BYTES = 64 * 1024;
let skippedLarge = 0;

function collectionMeta(prefix: string, s: SetFiles, total: number): CollectionMeta {
  const lic = s.info.license ?? { title: "Unknown" };
  return {
    prefix,
    name: s.info.name,
    kind: KINDS[prefix] ?? (s.info.category === "Emoji" ? "emoji" : "icons"),
    total,
    author: { name: s.info.author?.name ?? "", url: s.info.author?.url },
    license: {
      title: lic.title,
      spdx: lic.spdx,
      url: lic.url,
      attribution: ATTRIBUTION_SPDX.test(lic.spdx ?? "") || /attribution/i.test(lic.title),
    },
    homepage: HOMEPAGES[prefix] ?? s.info.author?.url,
    category: s.info.category,
    palette: Boolean(s.info.palette),
    height: typeof s.info.height === "number" ? s.info.height : undefined,
    samples: s.info.samples ?? [],
    version: s.version,
    suffixes: resolveSuffixes(prefix, s.meta.suffixes),
  };
}

function categoryLookup(meta: IconifyMetaData): Map<string, string> {
  const map = new Map<string, string>();
  for (const [cat, names] of Object.entries(meta.categories ?? {})) {
    for (const n of names) if (!map.has(n)) map.set(n, cat);
  }
  return map;
}

function sqlStr(v: string | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return "'" + v.replace(/'/g, "''") + "'";
}

function iconRow(r: IconRecord): string {
  return `(${[
    sqlStr(r.id),
    sqlStr(r.prefix),
    sqlStr(r.name),
    sqlStr(r.body),
    r.width,
    r.height,
    r.left,
    r.top,
    r.rotate,
    r.hFlip ? 1 : 0,
    r.vFlip ? 1 : 0,
    sqlStr(r.family),
    sqlStr(r.style),
    sqlStr(r.category),
    sqlStr(r.aliases.length ? JSON.stringify(r.aliases) : null),
  ].join(",")})`;
}

function collectionRow(c: CollectionMeta): string {
  return `(${[
    sqlStr(c.prefix),
    sqlStr(c.name),
    sqlStr(c.kind),
    c.total,
    sqlStr(c.author.name),
    sqlStr(c.author.url),
    sqlStr(c.license.title),
    sqlStr(c.license.spdx),
    sqlStr(c.license.url),
    c.license.attribution ? 1 : 0,
    sqlStr(c.homepage),
    sqlStr(c.category),
    c.palette ? 1 : 0,
    c.height ?? "NULL",
    sqlStr(JSON.stringify(c.samples)),
    sqlStr(c.version),
    sqlStr(JSON.stringify(c.suffixes)),
  ].join(",")})`;
}

const ICON_COLS =
  "(id,prefix,name,body,width,height,ox,oy,rotate,hflip,vflip,family,style,category,aliases)";
const COLLECTION_COLS =
  "(prefix,name,kind,total,author_name,author_url,license_title,license_spdx,license_url,attribution,homepage,category,palette,height,samples,version,suffixes)";

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, "seed"), { recursive: true });

  const prefixes: SearchIndexData["prefixes"] = [];
  const indexIcons: IndexIconEntry[] = [];
  const texts: string[] = [];
  const textIds = new Map<string, number>();
  const categoryNames: string[] = [];
  const categoryIds = new Map<string, number>();
  const categoryId = (c: string | null) => {
    if (c === null) return -1;
    let id = categoryIds.get(c);
    if (id === undefined) {
      id = categoryNames.length;
      categoryNames.push(c);
      categoryIds.set(c, id);
    }
    return id;
  };
  const collections: CollectionMeta[] = [];
  const textId = (t: string) => {
    let id = textIds.get(t);
    if (id === undefined) {
      id = texts.length;
      texts.push(t);
      textIds.set(t, id);
    }
    return id;
  };

  let seedFile = 0;
  let seedRows: string[] = [];
  let seedBytes = 0;
  // D1 rejects statements over ~100KB (SQLITE_TOOBIG), so group rows by byte size.
  const MAX_STMT_BYTES = 80 * 1024;
  const MAX_FILE_BYTES = 4 * 1024 * 1024;
  const flushSeed = async (force = false) => {
    if (seedRows.length === 0 || (!force && seedBytes < MAX_FILE_BYTES)) return;
    const stmts: string[] = [];
    let group: string[] = [];
    let groupBytes = 0;
    const emit = () => {
      if (group.length) stmts.push(`INSERT OR REPLACE INTO icons ${ICON_COLS} VALUES\n${group.join(",\n")};`);
      group = [];
      groupBytes = 0;
    };
    for (const row of seedRows) {
      if (groupBytes + row.length > MAX_STMT_BYTES) emit();
      group.push(row);
      groupBytes += row.length;
    }
    emit();
    const file = join(DIST, "seed", `icons-${String(seedFile++).padStart(3, "0")}.sql`);
    await writeFile(file, stmts.join("\n\n") + "\n");
    seedRows = [];
    seedBytes = 0;
  };

  let totalIcons = 0;
  let totalAliases = 0;

  for (const prefix of PREFIXES) {
    const set = await loadSet(prefix);
    const suffixes = resolveSuffixes(prefix, set.meta.suffixes);
    const categories = categoryLookup(set.meta);
    const prefixIdx = prefixes.length;
    prefixes.push({ prefix, name: set.info.name, suffixes });

    const iconIdxByName = new Map<string, number>();
    const aliasesByParent = new Map<string, string[]>();
    const records: IconRecord[] = [];

    // Real icons first (aliases with transforms become real icons too).
    parseIconSet(set.icons, (name, data) => {
      if (!data) return;
      if (data.body.length > MAX_BODY_BYTES) {
        skippedLarge += 1;
        return;
      }
      const alias = set.icons.aliases?.[name];
      const isPureAlias =
        alias !== undefined &&
        !alias.hFlip &&
        !alias.vFlip &&
        !alias.rotate &&
        alias.left === undefined &&
        alias.top === undefined &&
        alias.width === undefined &&
        alias.height === undefined;
      if (isPureAlias) {
        const parent = alias.parent;
        let list = aliasesByParent.get(parent);
        if (!list) aliasesByParent.set(parent, (list = []));
        list.push(name);
        return;
      }
      const { family, style } = splitVariant(name, suffixes);
      const record: IconRecord = {
        id: `${prefix}:${name}`,
        prefix,
        name,
        body: data.body,
        width: data.width ?? set.icons.width ?? 16,
        height: data.height ?? set.icons.height ?? 16,
        left: data.left ?? 0,
        top: data.top ?? 0,
        rotate: data.rotate ?? 0,
        hFlip: Boolean(data.hFlip),
        vFlip: Boolean(data.vFlip),
        family,
        style,
        category: categories.get(name) ?? categories.get(family) ?? null,
        aliases: [],
      };
      iconIdxByName.set(name, indexIcons.length);
      indexIcons.push([prefixIdx, name, textId(humanize(family)), categoryId(record.category)]);
      records.push(record);
    });

    for (const [parent, names] of aliasesByParent) {
      const parentIdx = iconIdxByName.get(parent);
      if (parentIdx === undefined) continue;
      const rec = records.find((r) => r.name === parent);
      if (rec) rec.aliases = names;
      for (const alias of names) {
        const p = indexIcons[parentIdx];
        indexIcons.push([prefixIdx, alias, p[2], p[3], parentIdx]);
      }
      totalAliases += names.length;
    }

    for (const r of records) {
      const row = iconRow(r);
      seedRows.push(row);
      seedBytes += row.length;
      await flushSeed();
    }
    totalIcons += records.length;
    collections.push(collectionMeta(prefix, set, records.length));
    console.log(`${prefix.padEnd(18)} ${String(records.length).padStart(6)} icons  ${String(aliasesByParent.size).padStart(5)} aliased`);
  }
  await flushSeed(true);

  const index: SearchIndexData = { v: 1, prefixes, categories: categoryNames, icons: indexIcons };
  await writeFile(join(DIST, "search-index.json"), JSON.stringify(index));
  await writeFile(join(DIST, "texts.json"), JSON.stringify(texts));
  await writeFile(join(DIST, "collections.json"), JSON.stringify(collections, null, 2));
  await writeFile(
    join(DIST, "seed", "collections.sql"),
    `DELETE FROM collections;\nINSERT INTO collections ${COLLECTION_COLS} VALUES\n${collections.map(collectionRow).join(",\n")};\n`,
  );

  console.log(`\n${totalIcons} icons, ${totalAliases} aliases, ${texts.length} unique texts, ${seedFile} seed files, ${skippedLarge} oversized icons skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
