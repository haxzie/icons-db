import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { buildSnippets, humanize, renderSVG, svgToDataUri, toIconifyIcon } from "@icons-db/core";
import { getAliasParent, getCollection, getIcon, getRelatedInSet, getSameFamilyAcrossSets, getVariants } from "@/lib/db";
import { collectionByPrefix } from "@/lib/collections";
import { iconDescription, iconJsonLd, iconTitle, JsonLd, SITE } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconPage } from "@/components/icon/IconPage";
import { IconLinkGrid, IconLinkTile } from "@/components/IconLinkTile";
import { LicenseBadge } from "@/components/LicenseBadge";

export const revalidate = 604800;

type Params = { prefix: string; name: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { prefix, name } = await params;
  const [icon, collection] = await Promise.all([getIcon(prefix, name), getCollection(prefix)]);
  if (!icon || !collection) return { title: "Icon not found", robots: { index: false } };
  const title = iconTitle(icon, collection);
  const description = iconDescription(icon, collection);
  const url = `/icon/${prefix}/${icon.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images: [`${url}/opengraph-image`] },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { prefix, name } = await params;
  const [icon, collection] = await Promise.all([getIcon(prefix, name), getCollection(prefix)]);
  if (!collection) notFound();
  if (!icon) notFound();
  if (icon.name !== name) {
    const parent = await getAliasParent(prefix, name);
    if (parent) permanentRedirect(`/icon/${prefix}/${parent}`);
    notFound();
  }

  const [variants, acrossSets, related] = await Promise.all([
    getVariants(prefix, icon.family),
    getSameFamilyAcrossSets(prefix, icon.family),
    getRelatedInSet(prefix, icon.family, icon.category),
  ]);
  const svg = renderSVG(toIconifyIcon(icon), { width: "1em", height: "1em" });
  const snippets = buildSnippets({ prefix, name: icon.name, svg, dataUri: svgToDataUri(svg) });
  const noun = collection.kind === "emoji" ? "emoji" : collection.kind === "brands" ? "logo" : "icon";
  const otherVariants = variants.filter((v) => v.name !== icon.name);

  return (
    <main className="flex-1 pb-16">
      <JsonLd data={iconJsonLd(icon, collection)} />
      <PageHeader
        crumbs={[
          { href: "/", label: "Search" },
          { href: "/library", label: "Library" },
          { href: `/library/${prefix}`, label: collection.name },
        ]}
        title={`${humanize(icon.family)} ${noun}`}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 md:px-8">
        <p className="mb-6 max-w-3xl text-fg-muted">
          <span className="font-mono text-fg">{icon.name}</span> from{" "}
          <Link href={`/library/${prefix}`} className="text-fg underline decoration-line">
            {collection.name}
          </Link>{" "}
          by {collection.author.name} · {icon.style}
          {icon.category && <> · {icon.category}</>} · <LicenseBadge license={collection.license} withLink />{" "}
          {collection.license.attribution ? "Attribution required." : "Free for personal and commercial use."}
        </p>

        <IconPage icon={icon} collection={collection} svg={svg} variants={variants.map((v) => ({ name: v.name, style: v.style }))} />

        {otherVariants.length > 0 && (
          <Section title={`${otherVariants.length} other ${otherVariants.length === 1 ? "variant" : "variants"} in ${collection.name}`}>
            <IconLinkGrid>
              {otherVariants.map((v) => (
                <IconLinkTile key={v.name} icon={v} setName={collection.name} />
              ))}
            </IconLinkGrid>
          </Section>
        )}

        {acrossSets.length > 0 && (
          <Section title={`The same ${noun} in other sets`}>
            <IconLinkGrid>
              {acrossSets.map((i) => (
                <IconLinkTile key={`${i.prefix}:${i.name}`} icon={i} setName={collectionByPrefix.get(i.prefix)?.name} showSet />
              ))}
            </IconLinkGrid>
          </Section>
        )}

        {related.length > 0 && (
          <Section title={icon.category ? `More ${icon.category.toLowerCase()} icons from ${collection.name}` : `Related icons in ${collection.name}`}>
            <IconLinkGrid>
              {related.map((i) => (
                <IconLinkTile key={i.name} icon={i} setName={collection.name} />
              ))}
            </IconLinkGrid>
          </Section>
        )}

        <Section title={`Use the ${humanize(icon.family)} ${noun}`}>
          <div className="grid gap-4 md:grid-cols-2">
            {snippets
              .filter((s) => ["svg", "react", "vue", "css"].includes(s.kind))
              .map((s) => (
                <div key={s.kind} className="min-w-0 rounded-2xl border bg-bg-elevated p-4">
                  <h3 className="mb-2 text-sm font-medium">{s.label}</h3>
                  <pre className="scrollbar-thin max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-fg-muted">{s.code}</pre>
                </div>
              ))}
          </div>
          <p className="mt-4 text-sm text-fg-muted">
            Direct links:{" "}
            <a href={`/api/v1/icon/${prefix}/${icon.name}.svg`} className="underline decoration-line hover:text-fg">
              SVG
            </a>
            {" · "}
            <a href={`/api/v1/icon/${prefix}/${icon.name}.svg?download`} className="underline decoration-line hover:text-fg">
              download
            </a>
            {" · "}
            <a href={`/api/v1/icons/${prefix}?icons=${icon.name}`} className="underline decoration-line hover:text-fg">
              JSON
            </a>
            {" · "}
            <span className="font-mono">{`${SITE}/api/v1/icon/${prefix}/${icon.name}.svg?color=%231a73e8&size=48`}</span>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      {children}
    </section>
  );
}
