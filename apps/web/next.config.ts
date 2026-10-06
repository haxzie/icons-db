import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@icons-db/core"],
  async headers() {
    // Let Cloudflare's CDN cache the ISR HTML at the edge (served without a
    // Worker invocation) while still revalidating in the background.
    const cache = { key: "Cache-Control", value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800" };
    // The keyword index is ~1.6 MB brotli (8.8 MB parsed) and nothing asks for
    // it until SearchApp/CollectionBrowser hydrate — measured ~450ms into a
    // warm load, which is what puts "loading index…" in the first result count.
    // A preload hint closes that gap: this one is acted on before the HTML body
    // is even parsed, so the download overlaps the stylesheet and the ~900 KB
    // of bundle instead of queueing behind them. `low` because nothing needs
    // the index until someone types, so it must not out-rank the bundles that
    // hydrate the page.
    //
    // It is a response header rather than a <link> or ReactDOM.preload in the
    // route's tree: a hint that lives in the React tree rides along in the RSC
    // payload, so Next's router prefetch of "/" made every page that links home
    // — /blog, /docs, all of them — download the index too.
    const preloadIndex = {
      key: "Link",
      value: "</data/search-index.json>; rel=preload; as=fetch; fetchpriority=low",
    };
    // Only on real document navigations. Prefetching "/" from another page
    // requests this same path with an RSC header, and Chrome honours a preload
    // in a Link header whatever the response it came on — which leaked the
    // index onto every page linking home all over again.
    const navigationOnly = [{ type: "header" as const, key: "RSC" }];
    return [
      { source: "/", missing: navigationOnly, headers: [preloadIndex] },
      // Not /library/category, which has no icon grid to search.
      { source: "/library/:prefix((?!category$)[^/]+)", missing: navigationOnly, headers: [preloadIndex] },
      { source: "/icon/:prefix/:name", headers: [cache] },
      { source: "/library/:prefix", headers: [cache] },
      { source: "/library/:prefix/page/:n", headers: [cache] },
      { source: "/icons/:concept", headers: [cache] },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
