import Link from "next/link";
import { renderInline, toIconifyIcon } from "@icons-db/core";
import type { IconLink } from "@/lib/db";

/** Server-rendered, crawlable icon tile: a real link with the SVG inlined. */
export function IconLinkTile({ icon, setName, showSet }: { icon: IconLink; setName?: string; showSet?: boolean }) {
  const { viewBox, body } = renderInline(toIconifyIcon(icon));
  const title = `${icon.name}${setName ? ` — ${setName}` : ""}`;
  return (
    <Link
      href={`/icon/${icon.prefix}/${icon.name}`}
      title={title}
      className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border border-line bg-bg-elevated transition hover:border-accent hover:ring-1 hover:ring-accent hover:shadow-[0_2px_10px_rgba(26,115,232,.3)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} className="size-9" role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: body }} />
      <span className="absolute inset-x-2 bottom-2 truncate text-center text-[11px] leading-tight">
        <span className="block truncate text-fg">{icon.name}</span>
        {showSet && setName && <span className="block truncate text-fg-subtle">{setName}</span>}
      </span>
    </Link>
  );
}

export function IconLinkGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">{children}</div>;
}
