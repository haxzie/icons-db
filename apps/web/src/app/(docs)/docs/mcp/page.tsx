import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";

export const metadata: Metadata = {
  title: "MCP server for coding agents",
  description:
    "Give Claude Code, Cursor, Codex or VS Code instant access to 146,000 open source icons. Remote MCP server with semantic search and paste-ready imports for lucide-react, heroicons, tabler and more.",
  alternates: { canonical: "/docs/mcp" },
  openGraph: { url: "/docs/mcp" },
};

const URL = "https://iconsdb.app/mcp";

const CLIENTS: { name: string; code: string }[] = [
  { name: "Claude Code", code: `claude mcp add --transport http iconsdb ${URL}` },
  { name: "Codex CLI", code: `codex mcp add iconsdb --url ${URL}` },
  { name: "Cursor (.cursor/mcp.json)", code: `{\n  "mcpServers": {\n    "iconsdb": { "url": "${URL}" }\n  }\n}` },
  { name: "VS Code (.vscode/mcp.json)", code: `{\n  "servers": {\n    "iconsdb": { "type": "http", "url": "${URL}" }\n  }\n}` },
  { name: "Windsurf / other clients", code: `{\n  "mcpServers": {\n    "iconsdb": { "serverUrl": "${URL}" }\n  }\n}` },
];

const TOOLS: { name: string; when: string; args: string }[] = [
  { name: "detect_icon_packages", when: "First call. Pass the project's dependency names; learns which icon sets are already installed.", args: "dependencies: string[]" },
  {
    name: "search_icons",
    when: "Find icons by meaning. Pass `queries` for several concepts at once to get one set that covers all of them, and `package` to keep results importable.",
    args: "query | queries[], package?, sets?, kind?, style?, license?, limit?",
  },
  {
    name: "get_icon",
    when: "Paste-ready code for one icon: the set's own npm import, the @iconify universal component, and an inline no-dependency component. Also variants and the same icon in other sets.",
    args: "id, format=react|vue|svelte|solid|svg|jsx|iconify|unplugin|css|data-uri|all, color?, size?, package?",
  },
  { name: "get_icons", when: "Batch get_icon for a whole nav bar or toolbar in one round-trip.", args: "ids[], format?, package?" },
  { name: "list_icon_sets", when: "All 57 sets with counts, licence, attribution flag and npm packages.", args: "kind?, license?, package?" },
];

export default function McpPage() {
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="MCP server" />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        <p className="text-fg-muted">
          A remote{" "}
          <a href="https://modelcontextprotocol.io" className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
            Model Context Protocol
          </a>{" "}
          server that lets coding agents search 146,000 open source icons by meaning and get back exactly the import they need — for the icon package
          already in your <code className="font-mono text-sm">package.json</code>. No install, no API key.
        </p>

        <div className="mt-6 rounded-2xl border bg-bg-elevated p-5">
          <div className="text-xs uppercase tracking-wide text-fg-subtle">Endpoint</div>
          <code className="mt-1 block font-mono text-lg">{URL}</code>
          <p className="mt-2 text-sm text-fg-muted">Streamable HTTP, stateless, rate-limited per IP. Works with any MCP client that supports remote servers.</p>
        </div>

        <h2 className="mt-10 text-lg font-medium">Connect</h2>
        <div className="mt-3 space-y-4">
          {CLIENTS.map((c) => (
            <div key={c.name}>
              <div className="mb-1 text-sm font-medium">{c.name}</div>
              <pre className="overflow-x-auto rounded-2xl border bg-bg-elevated p-4 font-mono text-[13px] leading-relaxed">{c.code}</pre>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-medium">What it&apos;s good at</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
          <li>
            <span className="text-fg">Intent search.</span> &ldquo;a shopping cart&rdquo;, &ldquo;log out&rdquo;, &ldquo;a lady cooking&rdquo; — hybrid keyword +
            semantic ranking across 57 sets.
          </li>
          <li>
            <span className="text-fg">Package-aware.</span> Tell it the project uses <code className="font-mono text-sm">lucide-react</code> and every result is
            an import you can paste: <code className="font-mono text-sm">{'import { House } from "lucide-react"'}</code>. Knows Heroicons, Tabler, Phosphor,
            Remix, Bootstrap, MDI, Font Awesome, Octicons, Radix, Simple Icons, react-icons and more; falls back to{" "}
            <code className="font-mono text-sm">@iconify/react</code> or an inline component for anything else.
          </li>
          <li>
            <span className="text-fg">Consistency.</span> Ask for several concepts at once and it tells you which single set covers all of them, so a nav bar
            doesn&apos;t end up mixing three icon styles.
          </li>
          <li>
            <span className="text-fg">Small responses.</span> Ten grouped rows per query by default, SVG only when asked, licence and attribution on every
            answer.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-medium">Tools</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border bg-bg-elevated">
          {TOOLS.map((t, i) => (
            <div key={t.name} className={`p-4 ${i > 0 ? "border-t" : ""}`}>
              <div className="font-mono text-sm font-medium">{t.name}</div>
              <p className="mt-1 text-sm text-fg-muted">{t.when}</p>
              <p className="mt-1 font-mono text-xs text-fg-subtle">{t.args}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-medium">Example</h2>
        <pre className="mt-3 overflow-x-auto rounded-2xl border bg-bg-elevated p-4 font-mono text-[13px] leading-relaxed">{`> Add home, settings and log-out icons to the sidebar using our existing icon library.

detect_icon_packages(["react", "next", "lucide-react"])
  → lucide-react (react) → sets: lucide

search_icons({ queries: ["home", "settings", "log out"], package: "lucide-react" })
  → Sets covering all 3 concepts: lucide
    home → lucide:house · settings → lucide:settings · log out → lucide:log-out

get_icons({ ids: ["lucide:house", "lucide:settings", "lucide:log-out"], format: "react" })
  → import { House } from "lucide-react";
    import { Settings } from "lucide-react";
    import { LogOut } from "lucide-react";
    License: ISC — free for commercial use, no attribution`}</pre>

        <p className="mt-8 text-sm text-fg-muted">
          Prefer plain HTTP? The same search and rendering is available as a{" "}
          <Link href="/api" className="underline decoration-line hover:text-fg">
            REST API
          </Link>
          . Icons keep their original licences — see{" "}
          <Link href="/licenses" className="underline decoration-line hover:text-fg">
            licenses
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
