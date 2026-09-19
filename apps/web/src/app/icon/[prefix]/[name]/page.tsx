import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderSVG, toIconifyIcon } from "@icons-db/core";
import { getCollection, getIcon } from "@/lib/db";
import { IconPage } from "@/components/icon/IconPage";

type Params = { prefix: string; name: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { prefix, name } = await params;
  const [icon, collection] = await Promise.all([getIcon(prefix, name), getCollection(prefix)]);
  if (!icon || !collection) return { title: "Icon not found" };
  const title = `${icon.name} icon — ${collection.name}`;
  const description = `Download or copy the ${icon.name} ${icon.style.toLowerCase()} icon from ${collection.name} (${collection.license.title}) as SVG, PNG, React, Vue or CSS.`;
  return {
    title,
    description,
    alternates: { canonical: `/icon/${prefix}/${icon.name}` },
    openGraph: { title, description, images: [`/api/v1/icon/${prefix}/${icon.name}.svg?color=%23000&size=512`] },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { prefix, name } = await params;
  const [icon, collection] = await Promise.all([getIcon(prefix, name), getCollection(prefix)]);
  if (!icon || !collection) notFound();
  const svg = renderSVG(toIconifyIcon(icon), { width: "1em", height: "1em" });
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <nav className="mb-6 text-sm text-fg-muted">
        <Link href="/" className="hover:text-fg">Search</Link> / <Link href="/library" className="hover:text-fg">Library</Link> /{" "}
        <Link href={`/library/${prefix}`} className="hover:text-fg">{collection.name}</Link> / <span className="text-fg">{icon.name}</span>
      </nav>
      <h1 className="sr-only">
        {icon.name} icon from {collection.name}
      </h1>
      <IconPage icon={icon} collection={collection} svg={svg} />
    </main>
  );
}
