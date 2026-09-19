import type { Metadata } from "next";
import { Suspense } from "react";
import { collections } from "@/lib/collections";
import { SearchApp } from "@/components/search/SearchApp";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense>
        <SearchApp collections={collections} />
      </Suspense>
    </main>
  );
}
