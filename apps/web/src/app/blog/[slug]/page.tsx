import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostSidebar } from "@/components/blog/PostSidebar";
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "IconsDB", url: SITE },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
  };
  return (
    <div className="flex flex-1">
      <JsonLd data={jsonLd} />
      <PostSidebar toc={post.toc} backHref="/blog" backLabel="All posts" />
      <main className="min-w-0 flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 md:px-8">
          <Link href={`/blog/category/${post.category}`} className="text-sm font-medium text-accent hover:underline">
            {categoryLabel(post.category)}
          </Link>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">{post.title}</h1>
          <p className="mt-3 text-sm font-medium text-fg-subtle">
            {post.author} · {new Date(post.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {post.readingMinutes} min read
          </p>
          <div className="mt-6 md:hidden">
            <PostSidebar toc={post.toc} backHref="/blog" backLabel="All posts" variant="inline" />
          </div>
          <article className="prose mt-6 scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
      </main>
    </div>
  );
}
