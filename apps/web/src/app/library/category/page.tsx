import type { Metadata } from "next";
import { itemList, JsonLd, og, pageJsonLd } from "@/lib/seo";
import { collections } from "@/lib/collections";
import { PageHeader } from "@/components/shell/PageHeader";
import { CategoryCards } from "@/components/library/CategoryCards";
import { LIBRARY_CATEGORIES } from "@/lib/library-categories";

export const metadata: Metadata = {
  title: "Icon categories",
  description: "Browse IconsDB's open source icon sets by category — UI essentials, brand logos, animated icons, emoji, developer and file types, flags, crypto and more.",
  alternates: { canonical: "/library/category" },
  openGraph: og({ url: "/library/category", images: [{ url: "/library/category/opengraph-image", width: 1200, height: 630, type: "image/png", alt: "Icon categories" }] }),
};

export default function CategoryIndexPage() {
  return (
    <main className="flex-1 pb-16">
      <JsonLd
        data={pageJsonLd({
          type: "CollectionPage",
          url: "/library/category",
          name: "Icon categories",
          description: metadata.description!,
          crumbs: [
            { name: "Library", url: "/library" },
            { name: "Categories", url: "/library/category" },
          ],
          extra: {
            mainEntity: itemList(
              LIBRARY_CATEGORIES.map((c) => ({ url: `/library/category/${c.slug}`, name: c.title })),
              { name: "Icon set categories" },
            ),
          },
        })}
      />
      <PageHeader crumbs={[{ href: "/", label: "Search" }, { href: "/library", label: "Library" }]} title="Categories" />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="mb-5 text-sm text-fg-muted">Shelves that group the library&rsquo;s {collections.length} sets by what they are for.</p>
        <CategoryCards layout="grid" />
      </div>
    </main>
  );
}
