import Link from "next/link";
import { CATEGORIES, type Post } from "@/lib/blog";

type Item = { slug: string; label: string; href: string; count: number };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONS: Record<string, React.ReactNode> = {
  all: (
    <svg viewBox="0 0 24 24" className="size-5" {...stroke}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  announcements: (
    <svg viewBox="0 0 24 24" className="size-5" {...stroke}>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM15 9a3.5 3.5 0 0 1 0 6M18 6a7 7 0 0 1 0 12" />
    </svg>
  ),
  showcase: (
    <svg viewBox="0 0 24 24" className="size-5" {...stroke}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9Z" />
    </svg>
  ),
  tips: (
    <svg viewBox="0 0 24 24" className="size-5" {...stroke}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  ),
  guides: (
    <svg viewBox="0 0 24 24" className="size-5" {...stroke}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5V5.5M8 8h8M8 12h6" />
    </svg>
  ),
};

export function BlogLayout({ active, counts, title, children }: { active: string; counts: Record<string, number>; title: string; children: React.ReactNode }) {
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  const items: Item[] = [
    { slug: "all", label: "All posts", href: "/blog", count: total },
    ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, href: `/blog/category/${c.slug}`, count: counts[c.slug] ?? 0 })),
  ];
  return (
    <div className="flex flex-1">
      <aside className="scrollbar-thin sticky top-0 hidden h-screen w-[320px] shrink-0 overflow-y-auto bg-panel md:block">
        <div className="px-5 pb-10 pt-6">
          <h2 className="mb-3 text-lg font-semibold">Blog</h2>
          <section className="border-t py-3">
            <div className="flex items-center gap-3 px-1 py-2 text-base font-semibold">
              <span className="grid size-6 place-items-center text-fg-muted">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6" />
                </svg>
              </span>
              Category
            </div>
            <ul className="px-1 pt-1">
              {items.map((it) => {
                const on = it.slug === active;
                return (
                  <li key={it.slug}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium transition ${on ? "bg-accent-soft text-fg" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center ${on ? "text-accent dark:text-[#d2e3fc]" : "text-fg-muted"}`}>{ICONS[it.slug]}</span>
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      <span className="text-sm font-medium tabular-nums text-fg-subtle">{it.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 md:px-8">
          <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
          <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:hidden" style={{ scrollbarWidth: "none" }}>
            {items.map((it) => (
              <Link key={it.slug} href={it.href} className="chip shrink-0" data-active={it.slug === active}>
                {it.label}
              </Link>
            ))}
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
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
            <h2 className="text-2xl font-semibold leading-snug group-hover:underline">{p.title}</h2>
            <p className="mt-2 text-[17px] leading-relaxed text-fg-muted">{p.description}</p>
            <p className="mt-3 text-sm font-medium text-fg-subtle">
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
