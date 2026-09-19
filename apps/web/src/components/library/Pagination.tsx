import Link from "next/link";

export const PER_PAGE = 120;

export function Pagination({ prefix, current, pages }: { prefix: string; current: number; pages: number }) {
  if (pages <= 1) return null;
  const window = 3;
  const items = new Set<number>([1, pages]);
  for (let i = current - window; i <= current + window; i++) if (i >= 1 && i <= pages) items.add(i);
  const list = Array.from(items).sort((a, b) => a - b);
  const href = (n: number) => (n === 1 ? `/library/${prefix}` : `/library/${prefix}/page/${n}`);
  return (
    <nav aria-label="Pages" className="mt-6 flex flex-wrap items-center gap-1 text-sm">
      {current > 1 && (
        <Link href={href(current - 1)} rel="prev" className="chip">
          Previous
        </Link>
      )}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && list[i - 1] !== n - 1 && <span className="px-1 text-fg-subtle">…</span>}
          <Link href={href(n)} className="chip" data-active={n === current} aria-current={n === current ? "page" : undefined}>
            {n}
          </Link>
        </span>
      ))}
      {current < pages && (
        <Link href={href(current + 1)} rel="next" className="chip">
          Next
        </Link>
      )}
    </nav>
  );
}
