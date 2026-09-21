import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";
import { OgCard } from "@/lib/og-card";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  return new ImageResponse(OgCard({ title: post?.title ?? "IconsDB blog", subtitle: post ? `IconsDB blog · ${post.readingMinutes} min read` : undefined }), size);
}
