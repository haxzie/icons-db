import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { getPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on choosing, licensing and using open source icons, plus IconsDB updates.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Blog" />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        <ul className="divide-y">
          {posts.map((p) => (
            <li key={p.slug} className="py-6">
              <Link href={`/blog/${p.slug}`} className="group block">
                <h2 className="text-xl font-medium group-hover:underline">{p.title}</h2>
                <p className="mt-1 text-fg-muted">{p.description}</p>
                <p className="mt-2 text-xs text-fg-subtle">
                  {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {p.readingMinutes} min read
                  {p.tags.length > 0 && <> · {p.tags.join(", ")}</>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
