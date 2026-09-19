"use client";

export type ViewMode = "compact" | "grid" | "large";

const VIEWS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "compact",
    label: "Compact",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M3 3h4v4H3zM10 3h4v4h-4zM17 3h4v4h-4zM3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4zM3 17h4v4H3zM10 17h4v4h-4zM17 17h4v4h-4z" />
      </svg>
    ),
  },
  {
    id: "grid",
    label: "Grid",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "large",
    label: "Large",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
];

export function Toolbar({
  filtersOpen,
  onToggleFilters,
  activeFilters,
  view,
  onView,
  children,
}: {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilters: number;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 pb-2 pt-1 md:px-8">
      <button
        type="button"
        onClick={onToggleFilters}
        className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium transition ${
          activeFilters > 0
            ? "bg-accent text-accent-fg hover:brightness-110"
            : filtersOpen
              ? "bg-accent-soft text-accent dark:text-[#d2e3fc]"
              : "border text-fg hover:bg-bg-muted"
        }`}
      >
        {filtersOpen ? (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        )}
        Filters
        {activeFilters > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-accent-fg/20 text-[11px] font-semibold text-accent-fg">{activeFilters}</span>
        )}
      </button>
      {children}
      <div className="ml-auto flex h-12 overflow-hidden rounded-full border">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onView(v.id)}
            title={v.label}
            className={`flex items-center gap-2 px-4 text-sm font-medium transition [&+&]:border-l ${
              view === v.id ? "bg-accent-soft text-accent dark:text-[#d2e3fc]" : "text-fg hover:bg-bg-muted"
            }`}
          >
            {v.icon}
            <span className="max-sm:hidden">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
