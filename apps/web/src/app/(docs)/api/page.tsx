import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API",
  description: "Free JSON and SVG API for 90,000+ open source icons: search, fetch icon data, and render SVGs on the fly.",
};

const BASE = "https://iconsdb.haxzie.com";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/search?q=shopping+cart&mode=hybrid&limit=50&prefixes=lucide,tabler",
    desc: "Search icons. mode is hybrid (default), keyword or semantic. prefixes optionally restricts to a comma separated list of sets. Returns { icons: [{ prefix, name, score }] }.",
  },
  {
    method: "GET",
    path: "/api/v1/icon/lucide/shopping-cart.svg?color=%23ff0000&size=48",
    desc: "Render an icon as SVG. Optional color (hex/name), width/height/size, and download (sends Content-Disposition). Cached at the edge for a year.",
  },
  {
    method: "GET",
    path: "/api/v1/icons/lucide?icons=house,check,award",
    desc: "Fetch raw icon data (Iconify format: body, width, height, transforms) for up to 200 icons from one set in a single request.",
  },
  {
    method: "GET",
    path: "/api/v1/collections",
    desc: "List all icon sets with author, license (SPDX), homepage, style suffixes and sample icons.",
  },
];

export default function ApiPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">API</h1>
      <p className="mt-2 text-fg-muted">
        Everything on this site is available as a free, CORS-enabled JSON/SVG API. No key needed; requests are rate limited per IP (120/min).
        Icons keep their original licenses — check <code className="font-mono text-sm">/api/v1/collections</code> for attribution requirements.
      </p>
      <div className="mt-8 space-y-6">
        {endpoints.map((e) => (
          <section key={e.path} className="rounded-xl border bg-bg-elevated p-4">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-xs text-accent">{e.method}</span>
              <a href={e.path} className="break-all font-mono text-sm hover:underline" target="_blank" rel="noreferrer">
                {e.path}
              </a>
            </div>
            <p className="mt-2 text-sm text-fg-muted">{e.desc}</p>
          </section>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-medium">Embedding an icon</h2>
      <pre className="mt-2 overflow-x-auto rounded-xl border bg-bg-elevated p-4 font-mono text-xs leading-relaxed text-fg-muted">
        {`<img src="${BASE}/api/v1/icon/tabler/brand-github.svg?size=24" alt="GitHub" />

/* or as a CSS mask so it follows currentColor */
.icon { -webkit-mask: url(${BASE}/api/v1/icon/tabler/brand-github.svg) center / contain no-repeat; background: currentColor; }`}
      </pre>
    </main>
  );
}
