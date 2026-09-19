import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/v1/search", "/api/v1/icons/"] }],
    sitemap: "https://iconsdb.app/sitemap.xml",
    host: "https://iconsdb.app",
  };
}
