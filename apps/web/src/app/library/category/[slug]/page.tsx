import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryBySlug, categorySets, LIBRARY_CATEGORIES } from "@/lib/library-categories";
import { JsonLd, og, SITE } from "@/lib/seo";
import { CategoryCards } from "@/components/library/CategoryCards";
import { CategoryHero } from "@/components/library/CategoryHero";
import { LibraryTable } from "@/components/library/LibraryTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return LIBRARY_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) return { title: "Not found", robots: { index: false } };
  const sets = categorySets(category);
  const icons = sets.reduce((n, s) => n + s.total, 0);
  const title = `${category.title} — ${sets.length} open source icon sets, ${icons.toLocaleString()} icons`;
  const image = { url: `/library/category/${slug}/opengraph-image`, width: 1200, height: 630, type: "image/png", alt: `${category.title} icon sets` };
  return {
    title,
    description: category.blurb,
    alternates: { canonical: `/library/category/${slug}` },
    openGraph: og({ title, description: category.blurb, url: `/library/category/${slug}`, images: [image] }),
    twitter: { card: "summary_large_image", title, description: category.blurb, images: [image.url] },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) notFound();
  const sets = categorySets(category);
  const icons = sets.reduce((n, s) => n + s.total, 0);
  const noAttribution = sets.filter((s) => !s.license.attribution).length;

  return (
    <main className="flex-1 pb-16">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${category.title} icon sets`,
            description: category.blurb,
            url: `${SITE}/library/category/${slug}`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: sets.length,
              itemListElement: sets.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/library/${s.prefix}`, name: s.name })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "IconsDB", item: SITE },
              { "@type": "ListItem", position: 2, name: "Library", item: `${SITE}/library` },
              { "@type": "ListItem", position: 3, name: category.title, item: `${SITE}/library/category/${slug}` },
            ],
          },
        ]}
      />
      <CategoryHero category={category} />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="mt-5 text-sm text-fg-muted">
          {sets.length} {sets.length === 1 ? "set" : "sets"}, {icons.toLocaleString()} icons. Every set is free for commercial use;{" "}
          {noAttribution === sets.length
            ? "none of them need attribution"
            : noAttribution === 0
              ? "all of them need attribution"
              : `${sets.length - noAttribution} of them need attribution`}
          .
        </p>
        <section className="mt-8">
          <LibraryTable heading="Sets in this category" collections={sets} searchPlaceholder="Search by name, author or license" />
        </section>

        <section className="mt-12 border-t pt-8">
          <h2 className="mb-1 text-lg font-medium">More categories</h2>
          <p className="mb-4 text-sm text-fg-muted">Other shelves in the library.</p>
          <CategoryCards exclude={slug} />
        </section>
      </div>
    </main>
  );
}
