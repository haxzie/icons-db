"use client";

import { forwardRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
  pending?: boolean;
  resultCount: number | null;
};

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, onSubmit, loading, pending, resultCount },
  ref,
) {
  return (
    <div className="sticky top-12 z-20 -mx-4 bg-bg/90 px-4 pb-3 pt-4 backdrop-blur">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit?.();
          }}
          placeholder="Search 90,000+ icons — try “shopping cart”, “log out”, or “github”"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl border bg-bg-elevated pl-12 pr-32 text-base shadow-sm outline-none ring-accent/40 transition focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs text-fg-subtle">
          {loading ? (
            <span>loading index…</span>
          ) : resultCount !== null ? (
            <span className="tabular-nums">
              {resultCount.toLocaleString()} {resultCount === 1 ? "result" : "results"}
              {pending && <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-accent align-middle" />}
            </span>
          ) : (
            <>
              <kbd>/</kbd>
              <span>to search</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
