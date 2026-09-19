import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
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
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Blog" width="max-w-5xl" />
      <BlogLayout active="all" counts={countByCategory(posts)}>
        <PostList posts={posts} />
      </BlogLayout>
    </main>
  );
}
