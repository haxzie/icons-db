import Link from "next/link";
import { rasterUrl, renderInline, toIconifyIcon } from "@icons-db/core";
import type { IconLink } from "@/lib/db";
import { IconLinkGridHover } from "./IconLinkGridHover";

/** Server-rendered, crawlable icon tile: a real link with the SVG inlined. */
export function IconLinkTile({ icon, setName, showSet }: { icon: IconLink; setName?: string; showSet?: boolean }) {
  const title = `${icon.name}${setName ? ` — ${setName}` : ""}`;
  // Raster icons have no body to inline; the PNG still renders server-side so
  // the tile stays a crawlable link with real artwork in the initial HTML.
  const { viewBox, body } = icon.raster ? { viewBox: "", body: "" } : renderInline(toIconifyIcon(icon));
  return (
    <Link
      href={`/icon/${icon.prefix}/${icon.name}`}
      title={title}
      className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border border-line bg-bg-elevated transition hover:border-accent hover:ring-1 hover:ring-accent hover:shadow-[0_2px_10px_rgba(26,115,232,.3)]"
    >
      {icon.raster ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 PNG at a fixed size
        <img src={rasterUrl(icon.prefix, icon.name)} alt={title} width={256} height={256} loading="lazy" decoding="async" className="size-9 object-contain" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} className="size-9" role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: body }} />
      )}
      <span className="absolute inset-x-2 bottom-2 truncate text-center text-[11px] leading-tight">
        <span className="block truncate text-fg">{icon.name}</span>
        {showSet && setName && <span className="block truncate text-fg-subtle">{setName}</span>}
      </span>
    </Link>
  );
}

export function IconLinkGrid({ children }: { children: React.ReactNode }) {
  // The tiles stay server components so they render as crawlable links; the
  // hover replay is therefore delegated from the grid rather than attached to
  // each of the few hundred of them.
  return (
    <IconLinkGridHover className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">{children}</IconLinkGridHover>
  );
}
