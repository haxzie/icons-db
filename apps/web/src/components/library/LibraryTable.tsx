"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import { LicenseBadge } from "../LicenseBadge";

export function LibraryTable({ collections }: { collections: CollectionMeta[] }) {
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
          (c.license.spdx ?? c.license.title).toLowerCase().includes(q),
      ),
    [collections, q],
  );

  return (
    <>
      <div className="mt-5 flex h-12 max-w-xl items-center rounded-full bg-bg-muted transition focus-within:bg-bg-elevated focus-within:shadow-[0_1px_6px_rgba(32,33,36,.28)] dark:focus-within:shadow-none dark:focus-within:ring-1 dark:focus-within:ring-line">
        <svg viewBox="0 0 24 24" className="ml-4 size-5 shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sets by name, author, type or license"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="mr-2 grid size-8 place-items-center rounded-full text-fg-muted hover:bg-bg-muted">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-fg-muted">
        {rows.length} of {collections.length} sets
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl border bg-bg-elevated">
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
