"use client";

import Link from "next/link";
import type { CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import { LicenseBadge } from "../LicenseBadge";

const SUGGESTIONS = ["shopping cart", "log out", "settings", "arrow right", "notification bell", "user profile", "github", "dark mode"];

export function CollectionsOverview({
  collections,
  onQuery,
}: {
  collections: CollectionMeta[];
  onPick: (prefix: string) => void;
  onQuery: (q: string) => void;
}) {
  const total = collections.reduce((n, c) => n + c.total, 0);
  return (
    <div className="fade-in">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <span>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onQuery(s)}
            className="rounded-md border bg-bg-elevated px-2 py-0.5 hover:border-fg-subtle hover:text-fg"
          >
            {s}
          </button>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium text-fg-muted">
        {collections.length} icon sets · {total.toLocaleString()} icons
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((c) => (
          <Link
            key={c.prefix}
            href={`/library/${c.prefix}`}
            className="group rounded-xl border bg-bg-elevated p-4 transition hover:border-fg-subtle"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-medium">{c.name}</h3>
                <p className="truncate text-xs text-fg-subtle">
                  {c.total.toLocaleString()} icons · {c.author.name}
                </p>
              </div>
              <LicenseBadge license={c.license} />
            </div>
            <div className="mt-3 flex gap-2 text-fg-muted group-hover:text-fg">
              {c.samples.slice(0, 6).map((s) => (
                <IconGlyph key={s} prefix={c.prefix} name={s} className="size-6" />
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
