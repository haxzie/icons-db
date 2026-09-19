import Link from "next/link";
import { CATEGORIES, type Post } from "@/lib/blog";

export function BlogLayout({ active, counts, children }: { active: string; counts: Record<string, number>; children: React.ReactNode }) {
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  const items = [{ slug: "all", label: "All", href: "/blog", count: total }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, href: `/blog/category/${c.slug}`, count: counts[c.slug] ?? 0 }))];
  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-4 md:px-8">
      <aside className="w-52 shrink-0 max-md:hidden">
        <nav className="sticky top-24">
          <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">Categories</div>
          <ul className="space-y-0.5">
            {items.map((it) => {
              const on = it.slug === active;
              return (
                <li key={it.slug}>
                  <Link
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center justify-between rounded-full px-3 py-2 text-sm transition ${
                      on ? "bg-accent-soft font-medium text-accent dark:text-[#d2e3fc]" : "text-fg-muted hover:bg-bg-muted hover:text-fg"
                    }`}
                  >
                    {it.label}
                    <span className="text-xs tabular-nums text-fg-subtle">{it.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:hidden" style={{ scrollbarWidth: "none" }}>
          {items.map((it) => (
            <Link key={it.slug} href={it.href} className="chip shrink-0" data-active={it.slug === active}>
              {it.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return <p className="py-12 text-fg-muted">Nothing here yet.</p>;
  return (
    <ul className="divide-y">
      {posts.map((p) => (
        <li key={p.slug} className="py-6 first:pt-0">
          <Link href={`/blog/${p.slug}`} className="group block">
            <h2 className="text-xl font-medium group-hover:underline">{p.title}</h2>
            <p className="mt-1 text-fg-muted">{p.description}</p>
            <p className="mt-2 text-xs text-fg-subtle">
              {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {p.readingMinutes} min read
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function countByCategory(posts: Post[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of posts) out[p.category] = (out[p.category] ?? 0) + 1;
  return out;
}
