import type { Metadata } from "next";
import Link from "next/link";
import { concepts, conceptName } from "@/lib/concepts";
import { og } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";

export const metadata: Metadata = {
  title: "Free icons by name — every concept across 82 open source sets",
  description: "Browse free SVG icons by what they depict: home, search, settings, arrows, users and thousands more, each compared across open source icon sets.",
  alternates: { canonical: "/icons" },
  openGraph: og({ url: "/icons" }),
};

export default function IconsIndex() {
  const letters = new Map<string, typeof concepts>();
  for (const c of [...concepts].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const l = c.slug[0].toUpperCase();
    letters.set(l, [...(letters.get(l) ?? []), c]);
  }
  const popular = concepts.slice(0, 60);
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Icons by name" />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 md:px-8">
        <p className="mb-8 max-w-3xl text-fg-muted">
          {concepts.length.toLocaleString()} icon concepts, each shown side by side across every open source set that draws it.
        </p>
        <h2 className="mb-3 text-lg font-medium">Most common</h2>
        <div className="mb-10 flex flex-wrap gap-2">
          {popular.map((c) => (
            <Link key={c.slug} href={`/icons/${c.slug}`} className="chip">
              {conceptName(c.slug)} <span className="text-fg-subtle">{c.sets}</span>
            </Link>
          ))}
        </div>
        {[...letters.entries()].map(([l, list]) => (
          <section key={l} className="mb-8">
            <h2 className="mb-2 text-lg font-medium">{l}</h2>
            <div className="columns-2 gap-6 text-sm sm:columns-3 lg:columns-5">
              {list.map((c) => (
                <Link key={c.slug} href={`/icons/${c.slug}`} className="block truncate py-0.5 text-fg-muted hover:text-fg hover:underline">
                  {conceptName(c.slug)}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
