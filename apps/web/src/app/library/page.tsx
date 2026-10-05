import type { Metadata } from "next";
import Link from "next/link";
import { og } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { CategoryCards } from "@/components/library/CategoryCards";
import { LibraryTable } from "@/components/library/LibraryTable";
import { SubmitSetButton } from "@/components/library/SubmitSetButton";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Icon sets",
  description: "Browse every open source icon set in IconsDB with licence details, authors and icon counts.",
  alternates: { canonical: "/library" },
  openGraph: og({ url: "/library" }),
};

export default function LibraryPage() {
  const total = collections.reduce((n, c) => n + c.total, 0);
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Library" action={<SubmitSetButton />} />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="text-sm text-fg-muted">
          {collections.length} curated open source sets, {total.toLocaleString()} icons. Every set is free for commercial use; sets marked amber need attribution.
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
