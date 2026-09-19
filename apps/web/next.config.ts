import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@icons-db/core"],
  async redirects() {
    return ["www.iconsdb.app", "iconsdb.haxzie.com"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://iconsdb.app/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
