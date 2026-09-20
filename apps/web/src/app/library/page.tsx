import type { Metadata } from "next";
import { og } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { LibraryTable } from "@/components/library/LibraryTable";
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
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Library" />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="text-sm text-fg-muted">
          {collections.length} curated open source sets, {total.toLocaleString()} icons. Every set is free for commercial use; sets marked amber need attribution.
        </p>
        <LibraryTable collections={collections} />
      </div>
    </main>
  );
}
