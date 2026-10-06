import type { Metadata } from "next";
import Link from "next/link";
import { itemList, JsonLd, og, pageJsonLd } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { CategoryCards } from "@/components/library/CategoryCards";
import { LibraryTable } from "@/components/library/LibraryTable";
import { SubmitSetButton } from "@/components/library/SubmitSetButton";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Icon sets",
  description: "Browse every icon set in IconsDB with licence details, authors and icon counts — 90 open source sets plus the App Store Top 500 app icons.",
  alternates: { canonical: "/library" },
  openGraph: og({ url: "/library" }),
};

export default function LibraryPage() {
  // Counted separately so the blanket "open source, free for commercial use"
  // line stays true: the app icons are neither, and a sentence covering
  // "every set" cannot quietly include them.
  const open = collections.filter((c) => !c.raster);
  const openTotal = open.reduce((n, c) => n + c.total, 0);
  const restricted = collections.filter((c) => c.raster);
  return (
    <main className="flex-1 pb-16">
      <JsonLd
        data={pageJsonLd({
          type: "CollectionPage",
          url: "/library",
          name: "Icon sets",
          description: metadata.description!,
          crumbs: [{ name: "Library", url: "/library" }],
          extra: {
            mainEntity: itemList(
              collections.map((c) => ({ url: `/library/${c.prefix}`, name: `${c.name} — ${c.total.toLocaleString()} icons (${c.license.title})` })),
              { name: "Icon sets on IconsDB" },
            ),
          },
        })}
      />
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Library" action={<SubmitSetButton />} />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="text-sm text-fg-muted">
          {open.length} curated open source sets, {openTotal.toLocaleString()} icons — all free for commercial use; sets marked amber need attribution.
          {restricted.map((c) => (
            <span key={c.prefix}>
              {" "}
              <Link href={`/library/${c.prefix}`} className="underline decoration-line hover:text-fg">
                {c.name}
              </Link>{" "}
              ({c.total.toLocaleString()} icons) is the exception: trademarks of their publishers, not openly licensed —{" "}
              <Link href="/licenses#app-icons" className="underline decoration-line hover:text-fg">
                terms
              </Link>
              .
            </span>
          ))}
        </p>
        {/* The only crawlable entry point into /icons, which is the larger of the
          * two browse surfaces — without it the concept pages hang off icon
          * detail pages alone. */}
        <p className="mt-2 text-sm text-fg-muted">
          After one particular thing?{" "}
          <Link href="/icons" className="text-accent hover:underline">
            Browse icons by name
          </Link>{" "}
          to see the same concept side by side across every set.
        </p>

        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-medium">Browse by category</h2>
            <Link href="/library/category" className="shrink-0 text-sm text-accent hover:underline">
              See all
            </Link>
          </div>
          <CategoryCards />
        </section>

        <section className="mt-10">
          <LibraryTable heading="All sets" collections={collections} searchPlaceholder="Search by name, author, type or license" />
        </section>
      </div>
    </main>
  );
}
