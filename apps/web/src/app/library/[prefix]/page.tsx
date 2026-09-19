import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collections } from "@/lib/collections";
import { CollectionBrowser } from "@/components/library/CollectionBrowser";

export function generateStaticParams() {
  return collections.map((c) => ({ prefix: c.prefix }));
}

export async function generateMetadata({ params }: { params: Promise<{ prefix: string }> }): Promise<Metadata> {
  const { prefix } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  if (!c) return { title: "Set not found" };
  return {
    title: `${c.name} icons`,
    description: `Browse and search all ${c.total.toLocaleString()} ${c.name} icons (${c.license.title}). Copy as SVG, React, Vue or CSS.`,
    alternates: { canonical: `/library/${prefix}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  if (!c) notFound();
  return <CollectionBrowser collection={c} collections={collections} />;
}
