import Link from "next/link";
import { LIBRARY_CATEGORIES, categoryCoverUrl, categorySets, type LibraryCategory } from "@/lib/library-categories";
import { ScrollRail } from "../shell/ScrollRail";

/**
 * The shelf row above the library table.
 *
 * The artwork is a static SVG rather than live icons because it has to be on
 * screen before anything loads — the search index these cards sit above takes
 * seconds, and a shelf of empty boxes is worse than no shelf. The animated
 * shelf's cover genuinely animates: SMIL runs inside an `<img>`.
 */
export function CategoryCards({ exclude, layout = "rail" }: { exclude?: string; layout?: "rail" | "grid" }) {
  const items = LIBRARY_CATEGORIES.filter((c) => c.slug !== exclude);
  const cards = items.map((c) => <CategoryCard key={c.slug} category={c} fluid={layout === "grid"} />);
  return layout === "grid" ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cards}</div>
  ) : (
    <ScrollRail step={700} className="-mx-4 px-4 md:-mx-8 md:px-8">
      {cards}
    </ScrollRail>
  );
}

function CategoryCard({ category, fluid }: { category: LibraryCategory; fluid?: boolean }) {
  const sets = categorySets(category);
  const icons = sets.reduce((n, s) => n + s.total, 0);
  return (
    <Link
      href={`/library/category/${category.slug}`}
      className={`group overflow-hidden rounded-3xl border bg-bg-elevated transition hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] ${fluid ? "" : "w-[280px] shrink-0 snap-start"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, and next/image would rasterise away the SMIL */}
      <img src={categoryCoverUrl(category.slug)} alt="" width={800} height={500} className="h-[164px] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
      <div className="px-4 py-3.5">
        <div className="text-[17px] font-medium leading-snug">{category.title}</div>
        <div className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-fg-muted">{category.tagline}</div>
        <div className="mt-2 text-xs tabular-nums text-fg-subtle">
          {sets.length} {sets.length === 1 ? "set" : "sets"} · {icons.toLocaleString()} icons
        </div>
      </div>
    </Link>
  );
}
