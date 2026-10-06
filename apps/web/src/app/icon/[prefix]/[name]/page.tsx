import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { buildRasterSnippets, buildSnippets, humanize, rasterUrl, renderSVG, toIconifyIcon } from "@icons-db/core";
import { getAliasParent } from "@/lib/db";
import { getIconPageData } from "@/lib/page-data";
import { collectionByPrefix } from "@/lib/collections";
import { appBySlug } from "@/lib/app-icons";
import { conceptBySlug } from "@/lib/concepts";
import { iconDescription, iconJsonLd, iconTitle, JsonLd, SITE } from "@/lib/seo";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconPage } from "@/components/icon/IconPage";
import { IconLinkGrid, IconLinkTile } from "@/components/IconLinkTile";
import { LicenseBadge } from "@/components/LicenseBadge";

export const revalidate = 604800;

type Params = { prefix: string; name: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { prefix, name } = await params;
  const collection = collectionByPrefix.get(prefix);
  const data = collection ? await getIconPageData(prefix, name) : null;
  if (!data || !collection) return { title: "Icon not found", robots: { index: false } };
  const { icon } = data;
  const title = iconTitle(icon, collection);
  const description = iconDescription(icon, collection);
  const url = `/icon/${prefix}/${icon.name}`;
  const image = { url: `${url}/opengraph-image`, width: 1200, height: 630, type: "image/png", alt: title };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images: [image] },
    // A page-level `twitter` replaces the root one wholesale, images included,
    // so the icon's own card has to be re-attached here or the tweet shows the
    // generic site card instead.
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { prefix, name } = await params;
  const collection = collectionByPrefix.get(prefix);
  if (!collection) notFound();
  const data = await getIconPageData(prefix, name);
  if (!data) {
    const parent = await getAliasParent(prefix, name);
    if (parent) permanentRedirect(`/icon/${prefix}/${parent}`);
    notFound();
  }
  const { icon, variants, acrossSets, related } = data;
  const app = icon.raster ? appBySlug.get(icon.name) : undefined;
  const svg = icon.raster ? "" : renderSVG(toIconifyIcon(icon), { width: "1em", height: "1em" });
  const snippets = icon.raster
    ? buildRasterSnippets({ prefix, name: icon.name, label: app?.name ?? humanize(icon.family), origin: SITE })
    : buildSnippets({ prefix, name: icon.name, svg });
  const noun = collection.kind === "emoji" ? "emoji" : collection.kind === "apps" ? "app icon" : collection.kind === "brands" ? "logo" : "icon";
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
        title={app ? `${app.name} ${noun}` : `${humanize(icon.family)} ${noun}`}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 md:px-8">
        {app ? (
          <p className="mb-6 max-w-3xl text-fg-muted">
            <span className="text-fg">{app.name}</span> by {app.publisher} · {app.genre} ·{" "}
            {app.ratings.toLocaleString()} ratings ·{" "}
            <a href={app.storeUrl} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
              View on the App Store
            </a>
            <br />
            This icon is the property of {app.publisher} and is shown to identify the app.{" "}
            <Link href="/licenses#app-icons" className="underline decoration-line hover:text-fg">
              Terms of use
            </Link>
            .
          </p>
        ) : (
          <p className="mb-6 max-w-3xl text-fg-muted">
            <span className="font-mono text-fg">{icon.name}</span> from{" "}
            <Link href={`/library/${prefix}`} className="text-fg underline decoration-line">
              {collection.name}
            </Link>{" "}
            by {collection.author.name} · {icon.style}
            {icon.category && <> · {icon.category}</>}
            {icon.animated && <> · animated</>} · <LicenseBadge license={collection.license} withLink />{" "}
            {collection.license.attribution ? "Attribution required." : "Free for personal and commercial use."}
          </p>
        )}

        <IconPage icon={icon} collection={collection} svg={svg} variants={variants.map((v) => ({ name: v.name, style: v.style }))} label={app?.name} />

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
          <Section
            title={`The same ${noun} in other sets`}
            aside={
              conceptBySlug.has(icon.family) ? (
                <Link href={`/icons/${icon.family}`} className="text-sm text-accent hover:underline">
                  All {humanize(icon.family)} icons →
                </Link>
              ) : undefined
            }
          >
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

        <Section title={`Use the ${app?.name ?? humanize(icon.family)} ${noun}`}>
          <div className="grid gap-4 md:grid-cols-2">
            {snippets
              .filter((s) => (icon.raster ? ["html", "react", "css", "markdown"] : ["svg", "react", "vue", "css"]).includes(s.kind))
              .map((s) => (
                <div key={s.kind} className="min-w-0 rounded-2xl border bg-bg-elevated p-4">
                  <h3 className="mb-2 text-sm font-medium">{s.label}</h3>
                  <pre className="scrollbar-thin max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-fg-muted">{s.code}</pre>
                  {s.note && <p className="mt-2 text-xs leading-relaxed text-fg-muted">{s.note}</p>}
                </div>
              ))}
          </div>
          {icon.raster ? (
            <p className="mt-4 text-sm text-fg-muted">
              Direct links:{" "}
              {[128, 256, 512, 1024].map((sz, i) => (
                <span key={sz}>
                  {i > 0 && " · "}
                  <a href={rasterUrl(prefix, icon.name, { size: sz as 128 })} className="underline decoration-line hover:text-fg">
                    {sz}px
                  </a>
                </span>
              ))}
              {" · "}
              <a href={rasterUrl(prefix, icon.name, { variant: "square" })} className="underline decoration-line hover:text-fg">
                square
              </a>
              {" · "}
              <span className="font-mono">{`${SITE}${rasterUrl(prefix, icon.name, { size: 512 })}`}</span>
            </p>
          ) : (
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
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
