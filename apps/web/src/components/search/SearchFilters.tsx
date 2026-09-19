"use client";

import { useState } from "react";
import type { CollectionKind, CollectionMeta, StyleBucket } from "@icons-db/core";
import { SidebarLabel, SidebarSection } from "../shell/FilterSidebar";
import { LicenseBadge } from "../LicenseBadge";

export type Kind = "all" | CollectionKind;

const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "icons", label: "Icons" },
  { id: "emoji", label: "Emoji" },
  { id: "brands", label: "Brands" },
];

const STYLES: { id: StyleBucket; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "filled", label: "Filled" },
  { id: "duotone", label: "Duotone" },
  { id: "light", label: "Light" },
  { id: "color", label: "Color" },
];

const KIND_TITLES: Record<CollectionKind, string> = { icons: "Icon sets", brands: "Brand logos", emoji: "Emoji sets" };

type Props = {
  collections: CollectionMeta[];
  counts: Map<string, number> | null;
  sets: string[];
  onToggleSet: (prefix: string) => void;
  onSets: (sets: string[]) => void;
  kind: Kind;
  onKind: (k: Kind) => void;
  style: StyleBucket | null;
  onStyle: (s: StyleBucket | null) => void;
  noAttribution: boolean;
  onNoAttribution: (v: boolean) => void;
  groupVariants: boolean;
  onGroupVariants: (v: boolean) => void;
  color: string;
  onColor: (c: string) => void;
};

export function SearchFilters(p: Props) {
  const [setQuery, setSetQuery] = useState("");
  const q = setQuery.trim().toLowerCase();
  const groups = (["icons", "brands", "emoji"] as CollectionKind[])
    .map((k) => ({
      kind: k,
      items: p.collections
        .filter((c) => c.kind === k && (!q || c.name.toLowerCase().includes(q) || c.prefix.includes(q)))
        .sort((a, b) => (p.counts ? (p.counts.get(b.prefix) ?? 0) - (p.counts.get(a.prefix) ?? 0) : 0) || a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <SidebarLabel>Preview</SidebarLabel>
      <div className="mb-4 flex items-center gap-3 rounded-xl border bg-bg-elevated px-3 py-2.5">
        <label className="relative grid size-8 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border" style={{ background: p.color || "var(--fg)" }}>
          <input type="color" value={p.color || "#202124"} onChange={(e) => p.onColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Icon color</div>
          <div className="truncate font-mono text-xs text-fg-muted">{p.color || "currentColor"}</div>
        </div>
        {p.color && (
          <button type="button" onClick={() => p.onColor("")} className="text-xs text-accent hover:underline">
            Reset
          </button>
        )}
      </div>
      <label className="mb-5 flex cursor-pointer items-center justify-between rounded-xl border bg-bg-elevated px-3 py-2.5 text-sm">
        <span>
          <span className="font-medium">Group variants</span>
          <span className="block text-xs text-fg-muted">One tile per icon family</span>
        </span>
        <Switch checked={p.groupVariants} onChange={p.onGroupVariants} />
      </label>

      <SidebarLabel>Filter</SidebarLabel>

      <SidebarSection title="Category" icon={<CategoryIcon />}>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k.id} type="button" className="chip" data-active={p.kind === k.id} onClick={() => p.onKind(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Style" icon={<StyleIcon />}>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button key={s.id} type="button" className="chip" data-active={p.style === s.id} onClick={() => p.onStyle(p.style === s.id ? null : s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="License" icon={<LicenseIcon />}>
        <label className="flex cursor-pointer items-center justify-between py-1 text-sm">
          <span>
            No attribution required
            <span className="block text-xs text-fg-muted">Hide CC-BY sets</span>
          </span>
          <Switch checked={p.noAttribution} onChange={p.onNoAttribution} />
        </label>
      </SidebarSection>

      <SidebarSection title="Icon sets" icon={<SetsIcon />}>
        <div className="mb-2 flex items-center gap-2">
          <input
            type="search"
            value={setQuery}
            onChange={(e) => setSetQuery(e.target.value)}
            placeholder="Find a set"
            className="h-9 min-w-0 flex-1 rounded-full border bg-bg-elevated px-3 text-sm outline-none focus:border-accent"
          />
          {p.sets.length > 0 && (
            <button type="button" onClick={() => p.onSets([])} className="shrink-0 text-xs text-accent hover:underline">
              Clear ({p.sets.length})
            </button>
          )}
        </div>
        {groups.map((g) => (
          <div key={g.kind} className="mb-2">
            <div className="px-1 py-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{KIND_TITLES[g.kind]}</div>
            {g.items.map((c) => {
              const n = p.counts?.get(c.prefix);
              const dim = p.counts !== null && !n;
              const checked = p.sets.includes(c.prefix);
              return (
                <label
                  key={c.prefix}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 ${dim ? "opacity-40" : ""}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => p.onToggleSet(c.prefix)} className="size-4 accent-accent" />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.license.attribution && <LicenseBadge license={c.license} />}
                  <span className="tabular-nums text-xs text-fg-subtle">{(n ?? c.total).toLocaleString()}</span>
                </label>
              );
            })}
          </div>
        ))}
      </SidebarSection>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full border bg-bg-muted transition peer-checked:border-accent peer-checked:bg-accent" />
      <span className="absolute left-1 size-4 rounded-full bg-fg-muted transition peer-checked:translate-x-5 peer-checked:bg-accent-fg" />
    </span>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6" />
    </svg>
  );
}
function StyleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 16 15h1.5a3.5 3.5 0 0 0 3.5-3.5A8.5 8.5 0 0 0 12 3Z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="10.5" cy="7.5" r="1" />
      <circle cx="15.5" cy="7.5" r="1" />
    </svg>
  );
}
function LicenseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 10a2.5 2.5 0 1 0 0 4M16.5 10a2.5 2.5 0 1 0 0 4" />
    </svg>
  );
}
function SetsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
