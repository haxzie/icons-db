import type { Metadata } from "next";
import Link from "next/link";
import { LicenseBadge } from "@/components/LicenseBadge";
import { IconGlyph } from "@/components/IconGlyph";
import { PageHeader } from "@/components/shell/PageHeader";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Icon sets",
  description: "Browse every open source icon set in IconsDB with licence details, authors and icon counts.",
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
      <div className="mt-6 overflow-hidden rounded-2xl border bg-bg-elevated">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted text-left text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-2 font-medium">Set</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Preview</th>
              <th className="px-4 py-2 font-medium text-right">Icons</th>
              <th className="px-4 py-2 font-medium">Author</th>
              <th className="px-4 py-2 font-medium">License</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.prefix} className="border-t hover:bg-bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link href={`/library/${c.prefix}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-fg-subtle">{c.prefix}</span>
                </td>
                <td className="px-4 py-2.5 capitalize text-fg-muted">{c.kind}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2 text-fg">
                    {c.samples.slice(0, 5).map((s) => (
                      <IconGlyph key={s} prefix={c.prefix} name={s} className="size-5" />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.total.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-fg-muted">
                  {c.author.url ? (
                    <a href={c.author.url} target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">
                      {c.author.name}
                    </a>
                  ) : (
                    c.author.name
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <LicenseBadge license={c.license} withLink />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}
