import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@icons-db/core"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
