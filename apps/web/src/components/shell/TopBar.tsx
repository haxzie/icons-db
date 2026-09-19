"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef } from "react";

export type SortKey = "relevance" | "name" | "set";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  sort?: SortKey;
  onSort?: (s: SortKey) => void;
  hint?: React.ReactNode;
  title?: React.ReactNode;
};

export const TopBar = forwardRef<HTMLInputElement, Props>(function TopBar(
  { value, onChange, onSubmit, placeholder, sort, onSort, hint, title },
  ref,
) {
  return (
    <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 md:px-8">
        {title ?? (
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[22px] font-medium tracking-tight max-sm:hidden">
            <Image src="/logo.svg" alt="" width={28} height={28} className="size-7 rounded-lg md:hidden" />
            IconsDB
          </Link>
        )}
        <div className="flex h-14 min-w-0 flex-1 items-center overflow-hidden rounded-full bg-bg-muted transition focus-within:bg-bg-elevated focus-within:shadow-[0_1px_6px_rgba(32,33,36,.28)] dark:focus-within:shadow-none dark:focus-within:ring-1 dark:focus-within:ring-line">
          <svg viewBox="0 0 24 24" className="ml-5 size-5 shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-base outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button type="button" onClick={() => onChange("")} aria-label="Clear" className="mr-2 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-bg-muted">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {!value && <span className="mr-5 hidden shrink-0 text-xs text-fg-subtle sm:block">{hint}</span>}
          {sort && onSort && (
            <label className="flex h-full shrink-0 cursor-pointer flex-col justify-center border-l px-5 text-xs text-fg-muted max-sm:hidden">
              Sort by
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value as SortKey)}
                className="-ml-0.5 cursor-pointer bg-transparent text-sm font-medium text-fg outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name</option>
                <option value="set">Icon set</option>
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );
});
