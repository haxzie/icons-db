"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import { LicenseBadge } from "../LicenseBadge";

export function LibraryTable({
  collections,
  heading,
  searchPlaceholder = "Search sets",
}: {
  collections: CollectionMeta[];
  /** Section title, paired with the filter box on one row. */
  heading: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      collections.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.prefix.includes(q) ||
          c.author.name.toLowerCase().includes(q) ||
          c.kind.includes(q) ||
          (c.animated > 0 && "animated".includes(q)) ||
          (c.license.spdx ?? c.license.title).toLowerCase().includes(q),
      ),
    [collections, q],
  );

  return (
    <>
      {/* The heading and the filter share a row, and the filter is sized and
        * bordered like the table it belongs to. As a full-width pill it read as
        * the site's main search, which it is not — it only narrows the rows
        * below it. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{heading}</h2>
        <div className="flex h-10 w-full items-center rounded-xl border bg-bg-elevated transition focus-within:border-accent sm:w-80">
          <svg viewBox="0 0 24 24" className="ml-3 size-4 shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="mr-1.5 grid size-7 place-items-center rounded-full text-fg-muted hover:bg-bg-muted">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Only worth saying while it is actually narrowing something — otherwise
        * it just repeats the count the page already gave. */}
      {q && (
        <p className="mb-3 text-sm font-medium text-fg-muted">
          {rows.length} of {collections.length} sets
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border bg-bg-elevated">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted text-left text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-2 font-medium">Set</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Preview</th>
              <th className="px-4 py-2 text-right font-medium">Icons</th>
              <th className="px-4 py-2 font-medium">Author</th>
              <th className="px-4 py-2 font-medium">License</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.prefix}
                onClick={() => router.push(`/library/${c.prefix}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/library/${c.prefix}`)}
                tabIndex={0}
                className="cursor-pointer border-t transition hover:bg-accent-soft/60 focus:outline-none focus-visible:bg-accent-soft/60"
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 font-mono text-xs text-fg-subtle">{c.prefix}</span>
                  {c.animated > 0 && (
                    <span
                      className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent"
                      title={`${c.animated.toLocaleString()} of ${c.total.toLocaleString()} icons animate`}
                    >
                      Animated
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 capitalize text-fg-muted">{c.kind}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2 text-fg">
                    {c.samples.slice(0, 5).map((s) => (
                      <IconGlyph key={s} prefix={c.prefix} name={s} className="size-5" />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.total.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-fg-muted">
                  {c.author.url ? (
                    <a href={c.author.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-fg hover:underline">
                      {c.author.name}
                    </a>
                  ) : (
                    c.author.name
                  )}
                </td>
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <LicenseBadge license={c.license} withLink />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-10 text-center text-fg-muted">
                  No sets match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
