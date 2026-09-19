import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogLayout, countByCategory, PostList } from "@/components/blog/BlogLayout";
import { CATEGORIES, getPosts } from "@/lib/blog";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) return { title: "Not found", robots: { index: false } };
  return { title: `${c.label} — Blog`, description: c.description, alternates: { canonical: `/blog/category/${c.slug}` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) notFound();
  const posts = await getPosts();
  return (
    <BlogLayout active={c.slug} counts={countByCategory(posts)} title={c.label}>
      <p className="mb-6 text-fg-muted">{c.description}</p>
      <PostList posts={posts.filter((p) => p.category === c.slug)} />
    </BlogLayout>
  );
}
