import type { CollectionMeta, IconRecord } from "@icons-db/core";
import { humanize } from "@icons-db/core";

export const SITE = "https://iconsdb.app";

export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, type: "image/png", alt: "IconsDB" };

/** Page-level openGraph replaces the root one wholesale, so re-attach the default image. */
export function og(overrides: Record<string, unknown> = {}) {
  return { images: [OG_IMAGE], ...overrides };
}

const KIND_NOUN = { icons: "icon", brands: "logo", emoji: "emoji" } as const;

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

export function iconTitle(icon: IconRecord, c: CollectionMeta): string {
  const noun = KIND_NOUN[c.kind];
  const style = c.kind === "icons" && icon.style && icon.style !== "Regular" ? ` ${icon.style.toLowerCase()}` : "";
  return `${titleCase(humanize(icon.family))}${style} ${noun} — ${c.name}`;
}

export function iconDescription(icon: IconRecord, c: CollectionMeta): string {
  const noun = KIND_NOUN[c.kind];
  const license = c.license.attribution ? `${c.license.title}, attribution required` : `${c.license.title}, free for commercial use`;
  const aliases = icon.aliases.length ? ` Also known as ${icon.aliases.slice(0, 3).join(", ")}.` : "";
  return `Download the ${humanize(icon.family)} ${noun} from ${c.name} (${license}) as SVG or PNG, or copy it as React, Vue, Svelte or CSS code.${aliases}`;
}

export function iconJsonLd(icon: IconRecord, c: CollectionMeta) {
  const url = `${SITE}/icon/${icon.prefix}/${icon.name}`;
  const name = iconTitle(icon, c);
  return [
    {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      name,
      description: iconDescription(icon, c),
      contentUrl: `${SITE}/api/v1/icon/${icon.prefix}/${icon.name}.svg`,
      thumbnailUrl: `${SITE}/api/v1/icon/${icon.prefix}/${icon.name}.svg?size=128`,
      url,
      encodingFormat: "image/svg+xml",
      license: c.license.url,
      acquireLicensePage: `${SITE}/licenses`,
      creditText: c.author.name,
      creator: { "@type": "Organization", name: c.author.name, url: c.author.url },
      copyrightNotice: `${c.author.name} — ${c.license.title}`,
      keywords: [humanize(icon.family), c.name, icon.style, icon.category, ...icon.aliases.map(humanize)].filter(Boolean).join(", "),
      isPartOf: { "@type": "Collection", name: c.name, url: `${SITE}/library/${c.prefix}` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "IconsDB", item: SITE },
        { "@type": "ListItem", position: 2, name: "Library", item: `${SITE}/library` },
        { "@type": "ListItem", position: 3, name: c.name, item: `${SITE}/library/${c.prefix}` },
        { "@type": "ListItem", position: 4, name: icon.name, item: url },
      ],
    },
  ];
}

export function collectionJsonLd(c: CollectionMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${c.name} icons`,
    url: `${SITE}/library/${c.prefix}`,
    description: `All ${c.total.toLocaleString()} ${c.name} icons, free to download as SVG/PNG or copy as code. ${c.license.title}.`,
    license: c.license.url,
    creator: { "@type": "Organization", name: c.author.name, url: c.author.url },
    numberOfItems: c.total,
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
