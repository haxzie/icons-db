import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CollectionKind } from "@icons-db/core";
import { collectionByPrefix, collections } from "@/lib/collections";
import { conceptBySlug, conceptName, conceptTitle } from "@/lib/concepts";
import { getConceptData } from "@/lib/page-data";
import { relatedConcepts } from "@/lib/search.server";
import { JsonLd, og, SITE } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconLinkGrid, IconLinkTile } from "@/components/IconLinkTile";
import { LicenseBadge } from "@/components/LicenseBadge";

export const revalidate = 604800;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ concept: string }> }): Promise<Metadata> {
  const { concept } = await params;
  const c = conceptBySlug.get(concept);
  if (!c) return { title: "Not found", robots: { index: false } };
  const name = conceptName(concept);
  const title = `${conceptTitle(concept)} icons — ${c.icons} free SVG icons from ${c.sets} sets`;
  const description = `Free ${name} icons in outline, filled and duotone styles from ${c.sets} open source icon sets (Lucide, Heroicons, Tabler, Phosphor and more). Download as SVG or PNG, or copy React, Vue and Svelte code.`;
  return {
    title,
    description,
    alternates: { canonical: `/icons/${concept}` },
    openGraph: og({ title, description, url: `/icons/${concept}`, images: [{ url: `/icons/${concept}/opengraph-image`, width: 1200, height: 630, type: "image/png", alt: title }] }),
    twitter: { card: "summary_large_image", title, description, images: [`/icons/${concept}/opengraph-image`] },
  };
}

const KIND_TITLES: Record<CollectionKind, string> = { icons: "Icon sets", brands: "Logos & file types", emoji: "Emoji" };

export default async function ConceptPage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  const c = conceptBySlug.get(concept);
  if (!c) notFound();
  const name = conceptName(concept);
  const [inSets, related] = await Promise.all([
    getConceptData(concept),
    relatedConcepts(SITE, concept, (s) => conceptBySlug.has(s)).catch(() => [] as string[]),
  ]);
  const groups = (["icons", "brands", "emoji"] as CollectionKind[])
    .map((k) => ({ kind: k, items: inSets.filter((i) => (collectionByPrefix.get(i.prefix)?.kind ?? "icons") === k) }))
    .filter((g) => g.items.length > 0);
  const noAttribution = inSets.filter((i) => !collectionByPrefix.get(i.prefix)?.license.attribution).length;
  const totalIcons = inSets.reduce((n, i) => n + i.variants, 0);

  return (
    <main className="flex-1 pb-16">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${conceptTitle(concept)} icons`,
            numberOfItems: inSets.length,
            itemListElement: inSets.map((i, n) => ({ "@type": "ListItem", position: n + 1, url: `${SITE}/icon/${i.prefix}/${i.name}`, name: `${name} — ${collectionByPrefix.get(i.prefix)?.name}` })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "IconsDB", item: SITE },
              { "@type": "ListItem", position: 2, name: "Icons", item: `${SITE}/icons` },
              { "@type": "ListItem", position: 3, name: `${conceptTitle(concept)} icons`, item: `${SITE}/icons/${concept}` },
            ],
          },
        ]}
      />
      <PageHeader crumbs={[{ href: "/", label: "Search" }, { href: "/icons", label: "Icons" }]} title={`${conceptTitle(concept)} icons`} />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 md:px-8">
        <p className="mb-8 max-w-3xl text-fg-muted">
          {totalIcons.toLocaleString()} free <span className="text-fg">{name}</span> icons across {inSets.length} open source sets — {noAttribution} of them need no attribution.
          Pick the set that matches your UI, then download the SVG or copy it as React, Vue, Svelte or CSS.{" "}
          <Link href={`/?q=${encodeURIComponent(name)}`} className="underline decoration-line hover:text-fg">
            Search all {name} icons
          </Link>
          .
        </p>

        {groups.map((g) => (
          <section key={g.kind} className="mb-10">
            <h2 className="mb-3 text-lg font-medium">{KIND_TITLES[g.kind]}</h2>
            <IconLinkGrid>
              {g.items.map((i) => {
                const set = collectionByPrefix.get(i.prefix);
                return (
                  <div key={i.prefix} className="relative">
                    <IconLinkTile icon={i} setName={set?.name} showSet />
                    {i.variants > 1 && (
                      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-bg-muted px-1.5 text-[10px] leading-4 text-fg-muted tabular-nums">{i.variants}</span>
                    )}
                  </div>
                );
              })}
            </IconLinkGrid>
          </section>
        ))}

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium">Licences</h2>
          <div className="flex flex-wrap gap-2">
            {inSets.map((i) => {
              const set = collectionByPrefix.get(i.prefix);
              if (!set) return null;
              return (
                <Link key={i.prefix} href={`/library/${i.prefix}`} className="chip">
                  {set.name} <LicenseBadge license={set.license} />
                </Link>
              );
            })}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-medium">Related icons</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r} href={`/icons/${r}`} className="chip">
                  {conceptName(r)}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-sm text-fg-muted">
          All {collections.length} sets on IconsDB are open source; each keeps its own licence — see{" "}
          <Link href="/licenses" className="underline decoration-line hover:text-fg">
            licences
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
