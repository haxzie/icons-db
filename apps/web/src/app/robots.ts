import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/v1/search",
          "/api/v1/icons/",
          // Auth callbacks and the MCP endpoint answer POSTs and set cookies;
          // nothing here is a page.
          "/api/auth/",
          "/mcp",
          // The search index and embeddings — tens of megabytes of JSON and
          // binary that a crawler would fetch and throw away.
          "/data/",
          // Other people's profile pictures.
          "/avatars/",
        ],
      },
    ],
    sitemap: "https://iconsdb.app/sitemap.xml",
    host: "https://iconsdb.app",
  };
}
