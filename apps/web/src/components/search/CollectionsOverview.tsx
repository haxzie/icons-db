"use client";

import Link from "next/link";
import type { CollectionKind, CollectionMeta } from "@icons-db/core";
import { IconGlyph } from "../IconGlyph";
import { LicenseBadge } from "../LicenseBadge";

const POPULAR = ["home", "search", "settings", "user", "heart", "star", "bell", "calendar", "shopping-cart", "trash", "arrow-right", "check", "menu", "download", "lock", "camera"];
const SUGGESTIONS = ["shopping cart", "log out", "settings", "arrow right", "notification bell", "user profile", "github", "party popper"];
const TITLES: Record<CollectionKind, string> = { icons: "Icon sets", brands: "Logos, file types & flags", emoji: "Emoji" };

export function CollectionsOverview({ collections, onQuery }: { collections: CollectionMeta[]; onQuery: (q: string) => void }) {
  const groups = (["icons", "brands", "emoji"] as CollectionKind[])
    .map((k) => ({ kind: k, items: collections.filter((c) => c.kind === k) }))
    .filter((g) => g.items.length > 0);
  return (
    <div className="fade-in">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <span className="mr-1">Try</span>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => onQuery(s)} className="chip">
            {s}
          </button>
        ))}
      </div>
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-medium">Browse by name</h2>
          <Link href="/icons" className="text-sm text-accent hover:underline">
            All concepts →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((c) => (
            <Link key={c} href={`/icons/${c}`} className="chip">
              {c.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </section>
      {groups.map((g) => (
        <section key={g.kind} className="mb-10">
          <h2 className="mb-3 text-lg font-medium">{TITLES[g.kind]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map((c) => (
              <Link
                key={c.prefix}
                href={`/library/${c.prefix}`}
                className="group rounded-2xl border bg-bg-elevated p-4 transition hover:border-accent hover:ring-1 hover:ring-accent hover:shadow-[0_2px_10px_rgba(26,115,232,.3)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{c.name}</h3>
                    <p className="truncate text-xs text-fg-muted">
                      {c.total.toLocaleString()} icons · {c.author.name}
                    </p>
                  </div>
                  <LicenseBadge license={c.license} />
                </div>
                <div className="mt-4 flex gap-3 text-fg">
                  {c.samples.slice(0, 6).map((s) => (
                    <IconGlyph key={s} prefix={c.prefix} name={s} className="size-7" />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
