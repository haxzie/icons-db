import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collections } from "@/lib/collections";
import { listCollectionPage } from "@/lib/db";
import { collectionJsonLd, JsonLd } from "@/lib/seo";
import { CollectionBrowser } from "@/components/library/CollectionBrowser";
import { IconLinkGrid, IconLinkTile } from "@/components/IconLinkTile";
import { Pagination, PER_PAGE } from "@/components/library/Pagination";

export const revalidate = 86400;

export function generateStaticParams() {
  return collections.map((c) => ({ prefix: c.prefix }));
}

export async function generateMetadata({ params }: { params: Promise<{ prefix: string }> }): Promise<Metadata> {
  const { prefix } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  if (!c) return { title: "Set not found", robots: { index: false } };
  const title = `${c.name} icons — ${c.total.toLocaleString()} free ${c.kind === "emoji" ? "emoji" : c.kind === "brands" ? "logos" : "icons"} (${c.license.spdx ?? c.license.title})`;
  const description = `Browse and search all ${c.total.toLocaleString()} ${c.name} icons by ${c.author.name}. ${c.license.title}${c.license.attribution ? ", attribution required" : ", free for commercial use"}. Download as SVG or PNG, or copy as React, Vue, Svelte or CSS.`;
  return {
    title,
    description,
    alternates: { canonical: `/library/${prefix}` },
    openGraph: { title, description, url: `/library/${prefix}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  if (!c) notFound();
  const { icons, total } = await listCollectionPage(prefix, 1, PER_PAGE);
  const pages = Math.ceil(total / PER_PAGE);
  return (
    <>
      <JsonLd data={collectionJsonLd(c)} />
      <CollectionBrowser collection={c} collections={collections} initialIcons={icons.map((i) => i.name)}>
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-1 text-lg font-medium">All {c.name} icons, A–Z</h2>
          <p className="mb-4 text-sm text-fg-muted">
            Page 1 of {pages} · {total.toLocaleString()} icons ·{" "}
            {c.license.attribution ? `${c.license.title}, attribution required` : `${c.license.title}, free for commercial use`}
          </p>
          <IconLinkGrid>
            {icons.map((i) => (
              <IconLinkTile key={i.name} icon={i} setName={c.name} />
            ))}
          </IconLinkGrid>
          <Pagination prefix={prefix} current={1} pages={pages} />
        </section>
      </CollectionBrowser>
    </>
  );
}
