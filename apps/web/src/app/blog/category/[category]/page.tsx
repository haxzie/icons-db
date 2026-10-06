import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogLayout, countByCategory, PostList } from "@/components/blog/BlogLayout";
import { CATEGORIES, getPosts } from "@/lib/blog";
import { blogJsonLd, JsonLd, og } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) return { title: "Not found", robots: { index: false } };
  return {
    title: `${c.label} — Blog`,
    description: c.description,
    alternates: { canonical: `/blog/category/${c.slug}` },
    openGraph: og({ title: `${c.label} — IconsDB Blog`, description: c.description, url: `/blog/category/${c.slug}`, type: "website" }),
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.slug === category);
  if (!c) notFound();
  const posts = await getPosts();
  const inCategory = posts.filter((p) => p.category === c.slug);
  return (
    <BlogLayout active={c.slug} counts={countByCategory(posts)} title={c.label}>
      <JsonLd
        data={blogJsonLd({
          url: `/blog/category/${c.slug}`,
          name: `${c.label} — IconsDB Blog`,
          description: c.description,
          crumbs: [
            { name: "Blog", url: "/blog" },
            { name: c.label, url: `/blog/category/${c.slug}` },
          ],
          posts: inCategory,
        })}
      />
      <p className="mb-6 text-fg-muted">{c.description}</p>
      <PostList posts={inCategory} />
    </BlogLayout>
  );
}
