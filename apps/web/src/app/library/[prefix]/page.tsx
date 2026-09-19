import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LicenseBadge } from "@/components/LicenseBadge";
import { CollectionBrowser } from "@/components/library/CollectionBrowser";
import { collections } from "@/lib/collections";

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
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6">
        <div>
          <nav className="text-sm text-fg-muted">
            <Link href="/library" className="hover:text-fg">Library</Link> / <span className="text-fg">{c.name}</span>
          </nav>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold tracking-tight">
            {c.name}
            <LicenseBadge license={c.license} withLink />
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {c.total.toLocaleString()} icons by{" "}
            {c.author.url ? (
              <a href={c.author.url} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                {c.author.name}
              </a>
            ) : (
              c.author.name
            )}
            {c.homepage && (
              <>
                {" · "}
                <a href={c.homepage} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                  Website
                </a>
              </>
            )}
            {c.version && <span className="ml-2 font-mono text-xs text-fg-subtle">v{c.version}</span>}
          </p>
        </div>
      </div>
      <CollectionBrowser collection={c} collections={collections} />
    </main>
  );
}
