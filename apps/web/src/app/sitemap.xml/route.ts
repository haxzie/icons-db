import { collections } from "@/lib/collections";
import { SITE } from "@/lib/seo";

export const revalidate = 86400;

export function GET() {
  const urls = [`${SITE}/sitemaps/pages/sitemap.xml`, `${SITE}/sitemaps/concepts/sitemap.xml`, ...collections.map((c) => `${SITE}/sitemaps/${c.prefix}/sitemap.xml`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" } });
}
