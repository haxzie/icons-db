import type { MetadataRoute } from "next";
import { collections } from "@/lib/collections";

const BASE = "https://iconsdb.app";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/library`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/api`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/licenses`, changeFrequency: "monthly", priority: 0.4 },
    ...collections.map((c) => ({ url: `${BASE}/library/${c.prefix}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
