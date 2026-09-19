import posts from "@/generated/posts.json";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
  html: string;
  readingMinutes: number;
};

export async function getPosts(): Promise<Post[]> {
  return posts as Post[];
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (posts as Post[]).find((p) => p.slug === slug);
}

export const CATEGORIES: { slug: string; label: string; description: string }[] = [
  { slug: "announcements", label: "Announcements", description: "New sets, features and releases." },
  { slug: "showcase", label: "Showcase", description: "Products and projects built with IconsDB." },
  { slug: "tips", label: "Tips", description: "Short, practical icon tips." },
  { slug: "guides", label: "Guides", description: "Longer reads on choosing, licensing and using icons." },
];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
