import type { License } from "@icons-db/core";

export function LicenseBadge({ license, withLink }: { license: License; withLink?: boolean }) {
  // `title` can be a sentence ("Trademarks of their owners"), which wraps and
  // overflows a 10px pill, so a set may supply a short label instead.
  const label = license.badge ?? license.spdx ?? license.title;
  const cls = license.restricted
    ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : license.attribution
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  const title = license.restricted
    ? `${license.title} — not openly licensed, see the terms before using one`
    : license.attribution
      ? `${license.title} — attribution required`
      : `${license.title} — free for commercial use, no attribution required`;
  const inner = (
    <span
      title={title}
      className={`shrink-0 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${cls}`}
    >
      {label}
    </span>
  );
  if (withLink && license.url) {
    return (
      <a href={license.url} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}
