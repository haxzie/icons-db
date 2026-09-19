// Renders content/blog/*.md to src/generated/posts.json so pages and the
// sitemap can import it — the Worker has no filesystem at request time.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "content", "blog");
const out = join(here, "..", "src", "generated", "posts.json");

const files = (await readdir(src)).filter((f) => f.endsWith(".md"));
const posts = [];
for (const file of files) {
  const raw = await readFile(join(src, file), "utf8");
  const { data, content } = matter(raw);
  posts.push({
    slug: file.replace(/\.md$/, ""),
    title: String(data.title ?? file),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    author: String(data.author ?? "IconsDB"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    category: String(data.category ?? "guides"),
    html: await marked.parse(content, { gfm: true }),
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).length / 220)),
  });
}
posts.sort((a, b) => b.date.localeCompare(a.date));
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(posts));
console.log(`built ${posts.length} blog posts`);
