import type { Metadata } from "next";
import { ICON_COUNT, itemList, JsonLd, og, pageJsonLd, SET_COUNT, SITE_TITLE } from "@/lib/seo";
import { Suspense } from "react";
import { collections } from "@/lib/collections";
import { SearchApp } from "@/components/search/SearchApp";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: og({ url: "/" }),
};

const DESCRIPTION = `Semantic search across ${ICON_COUNT.toLocaleString()} icons from ${SET_COUNT} sets. Download as SVG or PNG, or copy as React, Vue, Svelte or CSS.`;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The search box is the page's whole chrome, so there is nowhere to put
          a visible heading — but the most important page on the site shipped
          with no h1 at all, and the first real heading in the markup was an h2
          ("Browse by name"). */}
      <h1 className="sr-only">{SITE_TITLE}</h1>
      <JsonLd
        data={pageJsonLd({
          url: "/",
          name: SITE_TITLE,
          description: DESCRIPTION,
          extra: {
            mainEntity: itemList(
              collections.map((c) => ({ url: `/library/${c.prefix}`, name: `${c.name} icons` })),
              { name: "Icon sets on IconsDB" },
            ),
          },
        })}
      />
      <Suspense>
        <SearchApp collections={collections} />
      </Suspense>
    </main>
  );
}
