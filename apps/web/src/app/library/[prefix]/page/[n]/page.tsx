import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { collections } from "@/lib/collections";
import { listCollectionPage } from "@/lib/db";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconLinkGrid, IconLinkTile } from "@/components/IconLinkTile";
import { LicenseBadge } from "@/components/LicenseBadge";
import { Pagination, PER_PAGE } from "@/components/library/Pagination";

export const revalidate = 86400;

type Params = { prefix: string; n: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { prefix, n } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  if (!c) return { title: "Set not found", robots: { index: false } };
  return {
    title: `${c.name} icons — page ${n}`,
    description: `Page ${n} of all ${c.total.toLocaleString()} ${c.name} icons, A–Z. ${c.license.title}. Download as SVG/PNG or copy as code.`,
    alternates: { canonical: `/library/${prefix}/page/${n}` },
  };
}

export default async function CollectionPageN({ params }: { params: Promise<Params> }) {
  const { prefix, n } = await params;
  const c = collections.find((x) => x.prefix === prefix);
  const page = Number(n);
  if (!c || !Number.isInteger(page) || page < 1) notFound();
  if (page === 1) permanentRedirect(`/library/${prefix}`);
  const { icons, total } = await listCollectionPage(prefix, page, PER_PAGE);
  const pages = Math.ceil(total / PER_PAGE);
  if (icons.length === 0) notFound();
  return (
    <main className="flex-1 pb-16">
      <PageHeader
        crumbs={[
          { href: "/library", label: "Library" },
          { href: `/library/${prefix}`, label: c.name },
        ]}
        title={`${c.name} icons — page ${page} of ${pages}`}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <p className="mb-4 text-sm text-fg-muted">
          {total.toLocaleString()} icons by {c.author.name} · <LicenseBadge license={c.license} withLink /> ·{" "}
          <Link href={`/library/${prefix}`} className="underline decoration-line hover:text-fg">
            search this set
          </Link>
        </p>
        <IconLinkGrid>
          {icons.map((i) => (
            <IconLinkTile key={i.name} icon={i} setName={c.name} />
          ))}
        </IconLinkGrid>
        <Pagination prefix={prefix} current={page} pages={pages} />
      </div>
    </main>
  );
}
