"use client";

import type { CollectionMeta, StyleBucket } from "@icons-db/core";

const STYLES: { id: StyleBucket; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "filled", label: "Filled" },
  { id: "duotone", label: "Duotone" },
  { id: "light", label: "Light" },
  { id: "color", label: "Brand" },
];

type Props = {
  collections: CollectionMeta[];
  selectedSets: string[];
  onToggleSet: (prefix: string) => void;
  onClearSets: () => void;
  counts: Map<string, number> | null;
  style: StyleBucket | null;
  onStyle: (s: StyleBucket | null) => void;
  groupVariants: boolean;
  onGroupVariants: (v: boolean) => void;
  cellSize: number;
  onCellSize: (n: number) => void;
};

export function Filters(p: Props) {
  const ordered = p.counts
    ? [...p.collections].sort((a, b) => (p.counts!.get(b.prefix) ?? 0) - (p.counts!.get(a.prefix) ?? 0))
    : p.collections;
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1">
        <Chip active={p.selectedSets.length === 0} onClick={p.onClearSets}>
          All sets
        </Chip>
        {ordered.map((c) => {
          const n = p.counts?.get(c.prefix);
          const dim = p.counts !== null && !n;
          return (
            <Chip
              key={c.prefix}
              active={p.selectedSets.includes(c.prefix)}
              onClick={() => p.onToggleSet(c.prefix)}
              className={dim ? "opacity-40" : ""}
            >
              {c.name}
              {n ? <span className="ml-1 tabular-nums text-fg-subtle">{n}</span> : null}
            </Chip>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {STYLES.map((s) => (
          <Chip key={s.id} active={p.style === s.id} onClick={() => p.onStyle(p.style === s.id ? null : s.id)} small>
            {s.label}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        <label className="flex cursor-pointer items-center gap-1.5 text-fg-muted">
          <input
            type="checkbox"
            checked={p.groupVariants}
            onChange={(e) => p.onGroupVariants(e.target.checked)}
            className="accent-accent"
          />
          Group variants
        </label>
        <span className="mx-1 h-4 w-px bg-line" />
        <label className="flex items-center gap-1.5 text-fg-muted">
          Size
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={p.cellSize}
            onChange={(e) => p.onCellSize(Number(e.target.value))}
            className="w-20 accent-accent"
          />
        </label>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className = "",
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border transition ${small ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"} ${
        active
          ? "border-accent bg-accent/10 text-fg"
          : "border-line bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg"
      } ${className}`}
    >
      {children}
    </button>
  );
}
