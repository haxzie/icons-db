import type { Metadata } from "next";
import { BlogLayout, countByCategory, PostList } from "@/components/blog/BlogLayout";
import { getPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on choosing, licensing and using open source icons, plus IconsDB updates.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <BlogLayout active="all" counts={countByCategory(posts)} title="All posts">
      <PostList posts={posts} />
    </BlogLayout>
  );
}
