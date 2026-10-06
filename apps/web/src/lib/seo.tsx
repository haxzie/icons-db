import type { CollectionMeta, IconRecord } from "@icons-db/core";
import { humanize, rasterUrl } from "@icons-db/core";
import { SITE } from "./site";
import { appBySlug } from "./app-icons";
import { collections } from "./collections";

export { SITE };

/* --------------------------------------------------------------- site facts */

/** Counts for titles and descriptions, derived from the shipped index rather
 * than typed into copy: every hardcoded one of these was stale (the home
 * description promised "76 more sets", /icons "82", /install "83"), and a
 * headline number that undercounts by a tenth is the kind of thing a reader
 * checks. */
export const SET_COUNT = collections.length;
export const OPEN_SET_COUNT = collections.filter((c) => !c.raster).length;

/** Rounded down to the thousand, so the "+" is always honest. */
const thousands = (n: number) => Math.floor(n / 1000) * 1000;

/** Every icon on the site. */
export const ICON_COUNT = thousands(collections.reduce((n, c) => n + c.total, 0));
/** Only the openly licensed ones — the number any sentence containing the
 * words "open source icons" has to use, since the app icons are neither. */
export const OPEN_ICON_COUNT = thousands(collections.filter((c) => !c.raster).reduce((n, c) => n + c.total, 0));

/** Sets named in the site description; the rest are counted. */
const NAMED_SETS = ["Lucide", "Heroicons", "Tabler", "Phosphor", "Material Symbols", "Font Awesome", "Twemoji", "Noto Emoji"];

export const SITE_TITLE = `IconsDB — search ${OPEN_ICON_COUNT.toLocaleString()}+ open source icons, logos & emoji`;
export const SITE_DESCRIPTION = `Instant, semantic search across ${NAMED_SETS.join(", ")} and ${(OPEN_SET_COUNT - NAMED_SETS.length).toLocaleString()} more open source sets. Copy as SVG, React, Vue or CSS.`;

export const OG_IMAGE = { url: `${SITE}/og.png`, secureUrl: `${SITE}/og.png`, width: 1200, height: 630, type: "image/png", alt: "IconsDB — open source icon search" };

/** Page-level openGraph replaces the root one wholesale, so re-attach the default image. */
export function og(overrides: Record<string, unknown> = {}) {
  return { images: [OG_IMAGE], ...overrides };
}

const KIND_NOUN = { icons: "icon", brands: "logo", emoji: "emoji", apps: "app icon" } as const;

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

/** What to call one icon in prose: the app's own name where we have it (so
 * "YouTube", not the humanised slug "Youtube"), otherwise the slug read out. */
function iconLabel(icon: { name: string; family?: string }, c: CollectionMeta): string {
  const app = c.raster ? appBySlug.get(icon.name) : undefined;
  return app?.name ?? titleCase(humanize(icon.family ?? icon.name));
}

export function iconTitle(icon: IconRecord, c: CollectionMeta): string {
  const noun = KIND_NOUN[c.kind];
  // "YouTube", not the humanised slug "Youtube" — these are brand names, and
  // their own capitalisation is the only correct one.
  const app = icon.raster ? appBySlug.get(icon.name) : undefined;
  if (app) return `${app.name} ${noun} — ${c.name}`;
  const style = c.kind === "icons" && icon.style && icon.style !== "Regular" ? ` ${icon.style.toLowerCase()}` : "";
  return `${titleCase(humanize(icon.family))}${style} ${noun} — ${c.name}`;
}

export function iconDescription(icon: IconRecord, c: CollectionMeta): string {
  const noun = KIND_NOUN[c.kind];
  if (icon.raster) {
    // No SVG and no component snippets to promise, so the copy says what is
    // actually on the page: PNGs at four sizes, in two shapes.
    const app = appBySlug.get(icon.name);
    const label = app?.name ?? humanize(icon.family);
    const by = app ? ` by ${app.publisher}` : "";
    return `Download the ${label}${by} ${noun} as a PNG at 128, 256, 512 or 1024px, rounded or square. Trademark of its owner — see the terms before using it.`;
  }
  const license = c.license.attribution ? `${c.license.title}, attribution required` : `${c.license.title}, free for commercial use`;
  const aliases = icon.aliases.length ? ` Also known as ${icon.aliases.slice(0, 3).join(", ")}.` : "";
  const animated = icon.animated ? " Animated SVG." : "";
  return `Download the ${humanize(icon.family)} ${noun} from ${c.name} (${license}) as SVG or PNG, or copy it as React, Vue, Svelte or CSS code.${animated}${aliases}`;
}

/* ------------------------------------------------------------------ JSON-LD */

/** Stable node ids, so the graph nodes on different pages refer to one another
 * instead of each page re-declaring its own copy of the site and publisher. */
export const ORG_ID = `${SITE}/#organization`;
export const SITE_ID = `${SITE}/#website`;

/** Absolute URL for a site-relative path. Schema.org `url`/`item` values have
 * to be absolute, and some of our data (app-icons' licence link) is relative. */
export function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Drops keys whose value is undefined/null/"" so a node never carries an
 * empty `description` or a `license: undefined`. */
function node<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null || v === "") delete obj[k];
  }
  return obj;
}

export type Crumb = { name: string; url: string };

/** Breadcrumbs for `url`, rooted at the home page — callers pass only the
 * steps below it, including the current page. */
export function breadcrumbJsonLd(url: string, crumbs: Crumb[]) {
  const trail = [{ name: "IconsDB", url: "/" }, ...crumbs];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${abs(url)}#breadcrumb`,
    itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.url) })),
  };
}

type ListItem = { url: string; name: string };

/** An inline ItemList, for use as a page's `mainEntity`. Not a standalone
 * node: no `@context`, because it is always nested in one that has it. */
export function itemList(items: ListItem[], opts: { name?: string; total?: number } = {}) {
  return node({
    "@type": "ItemList",
    name: opts.name,
    // `numberOfItems` counts the collection, which can be larger than the
    // slice we list — an ItemList of 60 out of 4,440 concepts shouldn't claim
    // the collection holds 60.
    numberOfItems: opts.total ?? items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.url) })),
  });
}

type PageType = "WebPage" | "CollectionPage" | "ItemPage" | "AboutPage" | "Blog";

/** The two nodes every indexable page emits: the page itself, wired to the
 * site and publisher declared once in the root layout, and its breadcrumbs. */
export function pageJsonLd(p: {
  type?: PageType;
  url: string;
  name: string;
  description?: string;
  crumbs?: Crumb[];
  image?: string;
  /** Merged into the page node — `mainEntity`, `primaryImageOfPage`, dates. */
  extra?: Record<string, unknown>;
}) {
  const url = abs(p.url);
  const crumbs = p.crumbs ?? [];
  const page = node({
    "@context": "https://schema.org",
    "@type": p.type ?? "WebPage",
    "@id": `${url}#page`,
    url,
    name: p.name,
    description: p.description,
    isPartOf: { "@id": SITE_ID },
    inLanguage: "en",
    primaryImageOfPage: p.image ? { "@type": "ImageObject", url: abs(p.image) } : undefined,
    breadcrumb: crumbs.length ? { "@id": `${url}#breadcrumb` } : undefined,
    ...p.extra,
  });
  return crumbs.length ? [page, breadcrumbJsonLd(p.url, crumbs)] : [page];
}

/** Publisher and site nodes, emitted once from the root layout. Every page's
 * own node points at these by `@id` rather than repeating them. */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORG_ID,
      name: "IconsDB",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png`, contentUrl: `${SITE}/logo.png` },
      image: OG_IMAGE.url,
      description: "Search engine for open source icons, logos and emoji, with an MCP server for coding agents.",
      sameAs: ["https://github.com/haxzie/icons-db", "https://x.com/haxzie_"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": SITE_ID,
      name: "IconsDB",
      alternateName: "IconsDB — open source icon search",
      url: SITE,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": ORG_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/** How a set's terms attach to a node. A restricted set has no licence to
 * point at — its "licence" link is our own terms page — so it gets
 * `usageInfo`, which states terms without implying a grant. `license` would
 * tell a crawler the icons are licensed to the reader, which is the one thing
 * these are not. The app icons' URL is also stored relative, hence `abs`. */
function terms(c: CollectionMeta): { license?: string; usageInfo?: string } {
  if (!c.license.url) return {};
  const url = abs(c.license.url);
  return c.license.restricted ? { usageInfo: url } : { license: url };
}

function creator(c: CollectionMeta) {
  return node({ "@type": "Organization", name: c.author.name, url: c.author.url });
}

export function iconJsonLd(icon: IconRecord, c: CollectionMeta) {
  const path = `/icon/${icon.prefix}/${icon.name}`;
  const url = abs(path);
  const name = iconTitle(icon, c);
  const description = iconDescription(icon, c);
  const app = icon.raster ? appBySlug.get(icon.name) : undefined;
  const contentUrl = icon.raster ? abs(rasterUrl(icon.prefix, icon.name, { size: 512 })) : `${SITE}/api/v1/icon/${icon.prefix}/${icon.name}.svg`;
  const image = node({
    "@type": "ImageObject",
    "@id": `${url}#icon`,
    name,
    description,
    contentUrl,
    thumbnailUrl: icon.raster ? abs(rasterUrl(icon.prefix, icon.name, { size: 128 })) : `${SITE}/api/v1/icon/${icon.prefix}/${icon.name}.svg?size=128`,
    url,
    encodingFormat: icon.raster ? "image/png" : "image/svg+xml",
    // Raster icons are square PNGs at a known size; an SVG's viewBox is the
    // only intrinsic size it has.
    width: icon.raster ? 512 : icon.width,
    height: icon.raster ? 512 : icon.height,
    ...terms(c),
    acquireLicensePage: `${SITE}/licenses`,
    // An app icon belongs to the app's publisher, not to the set's nominal
    // author ("App publishers"), and we know which publisher — crediting the
    // placeholder would be wrong about the one thing these fields are for.
    creditText: app?.publisher ?? c.author.name,
    creator: app ? { "@type": "Organization", name: app.publisher } : creator(c),
    copyrightNotice: app ? `${app.publisher} — trademark of its owner` : `${c.author.name} — ${c.license.title}`,
    keywords: [humanize(icon.family), c.name, icon.style, icon.category, ...icon.aliases.map(humanize)].filter(Boolean).join(", "),
    isPartOf: { "@type": "CollectionPage", "@id": `${SITE}/library/${c.prefix}#page`, name: `${c.name} icons`, url: `${SITE}/library/${c.prefix}` },
    representativeOfPage: true,
  });
  return [
    // The ImageObject is a root node, which is where Google looks for the
    // image-licence fields, and the page node points at it by `@id` as both
    // its `mainEntity` and its `primaryImageOfPage` — one graph, not two
    // unconnected roots, and the image declared once.
    ...pageJsonLd({
      type: "ItemPage",
      url: path,
      name,
      description,
      crumbs: [
        { name: "Library", url: "/library" },
        { name: c.name, url: `/library/${c.prefix}` },
        // The crumb matches the page's own heading rather than the raw slug.
        { name: `${iconLabel(icon, c)} ${KIND_NOUN[c.kind]}`, url: path },
      ],
      extra: { mainEntity: { "@id": `${url}#icon` }, primaryImageOfPage: { "@id": `${url}#icon` } },
    }),
    { "@context": "https://schema.org", ...image },
  ];
}

export function collectionJsonLd(c: CollectionMeta, icons: { name: string }[] = [], page = 1) {
  const path = page > 1 ? `/library/${c.prefix}/page/${page}` : `/library/${c.prefix}`;
  const suffix = page > 1 ? ` — page ${page}` : "";
  const noun = KIND_NOUN[c.kind];
  const description = c.raster
    ? `All ${c.total.toLocaleString()} ${c.name} icons, as PNGs at 128, 256, 512 and 1024px. ${c.license.title}.`
    : `All ${c.total.toLocaleString()} ${c.name} icons, free to download as SVG/PNG or copy as code. ${c.license.title}.`;
  return pageJsonLd({
    type: "CollectionPage",
    url: path,
    name: `${c.name} icons${suffix}`,
    description,
    crumbs: [
      { name: "Library", url: "/library" },
      ...(page > 1 ? [{ name: c.name, url: `/library/${c.prefix}` }, { name: `Page ${page}`, url: path }] : [{ name: c.name, url: path }]),
    ],
    extra: node({
      ...terms(c),
      creator: creator(c),
      isBasedOn: c.homepage,
      mainEntity: itemList(
        icons.map((i) => ({ url: `/icon/${c.prefix}/${i.name}`, name: `${iconLabel(i, c)} ${noun}` })),
        { name: `${c.name} icons`, total: c.total },
      ),
    }),
  });
}

export const BLOG_ID = `${SITE}/blog#blog`;

type PostStub = { slug: string; title: string; description: string; date: string; author: string };

/** The blog index and its category listings. Both carry the posts they list as
 * `blogPost` stubs; the index owns the `Blog` node that each post page's
 * `isPartOf` points at, so a category page is a CollectionPage inside it. */
export function blogJsonLd(p: { url: string; name: string; description: string; crumbs?: Crumb[]; posts: PostStub[]; index?: boolean }) {
  const blogPost = p.posts.map((post) => ({
    "@type": "BlogPosting",
    "@id": `${SITE}/blog/${post.slug}#post`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE}/blog/${post.slug}`,
    author: { "@type": "Person", name: post.author },
  }));
  return pageJsonLd({
    type: p.index ? "Blog" : "CollectionPage",
    url: p.url,
    name: p.name,
    description: p.description,
    crumbs: p.crumbs,
    extra: node({
      "@id": p.index ? BLOG_ID : undefined,
      publisher: { "@id": ORG_ID },
      isPartOf: p.index ? { "@id": SITE_ID } : { "@type": "Blog", "@id": BLOG_ID, name: "IconsDB Blog", url: `${SITE}/blog` },
      blogPost,
    }),
  });
}

export function JsonLd({ data }: { data: unknown }) {
  // Escape `<` so an icon name or set title containing "</script" cannot close
  // the tag early; \u003c is still the same string once parsed as JSON.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
