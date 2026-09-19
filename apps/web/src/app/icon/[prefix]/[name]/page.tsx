import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
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
    <main className="flex-1 pb-16">
      <PageHeader
        crumbs={[
          { href: "/", label: "Search" },
          { href: "/library", label: "Library" },
          { href: `/library/${prefix}`, label: collection.name },
        ]}
        title={icon.name}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-8">
        <IconPage icon={icon} collection={collection} svg={svg} />
      </div>
    </main>
  );
}
