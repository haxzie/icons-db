import Link from "next/link";
import { categoryCoverUrl, type LibraryCategory } from "@/lib/library-categories";
import { SubmitSetButton } from "./SubmitSetButton";

/** The banner at the top of a category page: the shelf's own artwork, with the
 * title and blurb laid over a scrim so they read against whatever is underneath. */
export function CategoryHero({ category }: { category: LibraryCategory }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-fg-muted">
          <Link href="/" className="hover:text-fg">
            Search
          </Link>
          <span className="mx-1.5 text-fg-subtle">/</span>
          <Link href="/library" className="hover:text-fg">
            Library
          </Link>
        </nav>
        <SubmitSetButton />
      </div>
      <div className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, and next/image would rasterise away the SMIL */}
        <img src={categoryCoverUrl(category.slug)} alt="" width={800} height={500} className="h-[200px] w-full object-cover md:h-[280px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/15" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
          <h1 className="text-[26px] font-medium tracking-tight text-white md:text-[34px]">{category.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80 md:text-base">{category.blurb}</p>
        </div>
      </div>
    </div>
  );
}
