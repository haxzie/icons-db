import { collectionByPrefix, collections } from "@/lib/collections";
import { listIconNames } from "@/lib/db";
import { getPosts } from "@/lib/blog";
import { concepts } from "@/lib/concepts";
import { PER_PAGE } from "@/components/library/Pagination";
import { SITE } from "@/lib/seo";

export const revalidate = 86400;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlset(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await ctx.params;
  const headers = { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" };

  if (prefix === "pages") {
    const posts = await getPosts();
    const staticPages = ["", "/library", "/icons", "/install", "/licenses", "/blog", "/blog/category/announcements", "/blog/category/showcase", "/blog/category/tips", "/blog/category/guides"].map((p) => `  <url><loc>${SITE}${p}</loc><changefreq>weekly</changefreq></url>`);
    const setPages = collections.flatMap((c) => {
      const pages = Math.ceil(c.total / PER_PAGE);
      return [
        `  <url><loc>${SITE}/library/${c.prefix}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
        ...Array.from({ length: pages - 1 }, (_, i) => `  <url><loc>${SITE}/library/${c.prefix}/page/${i + 2}</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`),
      ];
    });
    const blog = posts.map((p) => `  <url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    return new Response(urlset([...staticPages, ...setPages, ...blog]), { headers });
  }

  if (prefix === "concepts") {
    const entries = concepts.map((c) => `  <url><loc>${SITE}/icons/${c.slug}</loc><changefreq>weekly</changefreq><priority>${c.sets >= 15 ? "0.8" : "0.6"}</priority></url>`);
    return new Response(urlset(entries), { headers });
  }

  const c = collectionByPrefix.get(prefix);
  if (!c) return new Response("not found", { status: 404 });
  const names = await listIconNames(prefix);
  const entries = names.map((n) => {
    const loc = `${SITE}/icon/${prefix}/${n}`;
    return `  <url><loc>${esc(loc)}</loc><changefreq>monthly</changefreq><image:image><image:loc>${esc(`${SITE}/api/v1/icon/${prefix}/${n}.svg`)}</image:loc><image:title>${esc(`${n} — ${c.name}`)}</image:title><image:license>${esc(c.license.url ?? `${SITE}/licenses`)}</image:license></image:image></url>`;
  });
  return new Response(urlset(entries), { headers });
}
