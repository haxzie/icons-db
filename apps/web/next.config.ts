import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@icons-db/core"],
  async headers() {
    // Let Cloudflare's CDN cache the ISR HTML at the edge (served without a
    // Worker invocation) while still revalidating in the background.
    const cache = { key: "Cache-Control", value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800" };
    return [
      { source: "/icon/:prefix/:name", headers: [cache] },
      { source: "/library/:prefix", headers: [cache] },
      { source: "/library/:prefix/page/:n", headers: [cache] },
      { source: "/icons/:concept", headers: [cache] },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
