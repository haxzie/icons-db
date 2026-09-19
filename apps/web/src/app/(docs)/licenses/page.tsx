import type { Metadata } from "next";
import Link from "next/link";
import type { CollectionKind } from "@icons-db/core";
import { PageHeader } from "@/components/shell/PageHeader";
import { LicenseBadge } from "@/components/LicenseBadge";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Licenses & attribution",
  description: "Every icon set on IconsDB with its author, license and link to the full license text.",
};

const TITLES: Record<CollectionKind, string> = { icons: "Icon sets", brands: "Brand logos, file types & flags", emoji: "Emoji" };

export default function LicensesPage() {
  const groups = (["icons", "brands", "emoji"] as CollectionKind[]).map((k) => ({ kind: k, items: collections.filter((c) => c.kind === k) }));
  const attribution = collections.filter((c) => c.license.attribution);
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Licenses & attribution" />
      <div className="mx-auto w-full max-w-4xl px-4 md:px-8">
        <p className="text-fg-muted">
          IconsDB redistributes open source icon sets in the normalised format published by{" "}
          <a href="https://iconify.design" className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
            Iconify
          </a>
          . IconsDB does not relicense anything: every icon stays under the license its authors chose, listed below with a link to the full text.
          The site and API code are MIT licensed.
        </p>

        <section className="mt-8 rounded-2xl border bg-bg-elevated p-5">
          <h2 className="font-medium">How to comply</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
            <li>
              <span className="text-fg">MIT, ISC, Apache-2.0, CC0</span> — free for personal and commercial use. Keep the license notice with the icons if you
              redistribute them as files; no credit needed in your UI.
            </li>
            <li>
              <span className="text-fg">CC-BY-4.0</span> ({attribution.filter((c) => c.license.spdx?.startsWith("CC-BY-4")).map((c) => c.name).join(", ")}) — credit the
              author and link the license somewhere reasonable (an about page or footer is fine).
            </li>
            <li>
              <span className="text-fg">CC-BY-SA-4.0</span> ({attribution.filter((c) => c.license.spdx?.includes("SA")).map((c) => c.name).join(", ")}) — as above, and if you
              modify the icons the result must be shared under the same license.
            </li>
            <li>We deliberately exclude GPL, non-commercial and paid sets so nothing here can pull a license into your own code.</li>
          </ul>
        </section>

        <TrademarkNotice className="mt-4" />

        {groups.map((g) => (
          <section key={g.kind} className="mt-10">
            <h2 className="mb-3 text-lg font-medium">{TITLES[g.kind]}</h2>
            <div className="overflow-hidden rounded-2xl border bg-bg-elevated">
              <table className="w-full text-sm">
                <thead className="bg-bg-muted text-left text-xs uppercase tracking-wide text-fg-subtle">
                  <tr>
                    <th className="px-4 py-2 font-medium">Set</th>
                    <th className="px-4 py-2 font-medium">Author</th>
                    <th className="px-4 py-2 font-medium">License</th>
                    <th className="px-4 py-2 font-medium">Attribution</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((c) => (
                    <tr key={c.prefix} className="border-t">
                      <td className="px-4 py-2.5">
                        <Link href={`/library/${c.prefix}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        {c.homepage && (
                          <a href={c.homepage} target="_blank" rel="noreferrer" className="ml-2 text-xs text-fg-subtle hover:text-fg hover:underline">
                            website
                          </a>
                        )}
                      </td>
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
                        <span className="mr-2">{c.license.title}</span>
                        <LicenseBadge license={c.license} withLink />
                      </td>
                      <td className="px-4 py-2.5 text-fg-muted">{c.license.attribution ? "Required" : "Not required"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
