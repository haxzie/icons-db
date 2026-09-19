import posts from "@/generated/posts.json";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  html: string;
  readingMinutes: number;
};

export async function getPosts(): Promise<Post[]> {
  return posts as Post[];
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (posts as Post[]).find((p) => p.slug === slug);
}
