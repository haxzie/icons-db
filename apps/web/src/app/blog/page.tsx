import type { Metadata } from "next";
import { BlogLayout, countByCategory, PostList } from "@/components/blog/BlogLayout";
import { getPosts } from "@/lib/blog";
import { blogJsonLd, JsonLd, og } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on choosing, licensing and using open source icons, plus IconsDB updates.",
  alternates: { canonical: "/blog" },
  openGraph: og({ url: "/blog", type: "website" }),
};

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <BlogLayout active="all" counts={countByCategory(posts)} title="All posts">
      <JsonLd
        data={blogJsonLd({
          index: true,
          url: "/blog",
          name: "IconsDB Blog",
          description: metadata.description!,
          crumbs: [{ name: "Blog", url: "/blog" }],
          posts,
        })}
      />
      <PostList posts={posts} />
    </BlogLayout>
  );
}
