import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { categoryLabel, getPost, getPosts } from "@/lib/blog";
import { JsonLd, SITE } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, url: `/blog/${post.slug}` },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <main className="flex-1 pb-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Person", name: post.author },
          publisher: { "@type": "Organization", name: "IconsDB", url: SITE },
          mainEntityOfPage: `${SITE}/blog/${post.slug}`,
        }}
      />
      <PageHeader crumbs={[
          { href: "/blog", label: "Blog" },
          { href: `/blog/category/${post.category}`, label: categoryLabel(post.category) },
        ]} title={post.title} width="max-w-3xl" />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        <p className="text-sm text-fg-subtle">
          {post.author} · {new Date(post.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {post.readingMinutes} min read
        </p>
        <article className="prose mt-6" dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </main>
  );
}
