import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { AgentTabs, type AgentGuide } from "@/components/install/AgentTabs";

export const metadata: Metadata = {
  title: "Install — MCP server & API for coding agents",
  description:
    "Connect Claude Code, Cursor, Codex, VS Code, Windsurf, Gemini CLI or Zed to 146,000 open source icons. Remote MCP server with semantic search and paste-ready imports, plus a free JSON/SVG API.",
  alternates: { canonical: "/install" },
  openGraph: { url: "/install" },
};

const URL = "https://iconsdb.app/mcp";
const TRY = 'Try: "add home, settings and log-out icons to the sidebar using the icon library already in package.json".';

const AGENTS: AgentGuide[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    steps: [
      { text: "Run once in your project (or add --scope user to enable it everywhere):", code: `claude mcp add --transport http iconsdb ${URL}` },
      { text: "Check it connected:", code: "claude mcp list" },
      { text: TRY },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    steps: [
      { text: "Add to your project's MCP config (or ~/.cursor/mcp.json for all projects):", file: ".cursor/mcp.json", code: `{\n  "mcpServers": {\n    "iconsdb": { "url": "${URL}" }\n  }\n}` },
      { text: "Open Settings → MCP and confirm iconsdb shows a green dot; enable its tools in Agent mode." },
      { text: TRY },
    ],
  },
  {
    id: "codex",
    name: "Codex CLI",
    steps: [
      { text: "Register the server:", code: `codex mcp add iconsdb --url ${URL}` },
      { text: "Or add it by hand:", file: "~/.codex/config.toml", code: `[mcp_servers.iconsdb]\nurl = "${URL}"` },
      { text: TRY },
    ],
  },
  {
    id: "vscode",
    name: "VS Code Copilot",
    steps: [
      { text: "Add to the workspace MCP config (Command Palette → MCP: Add Server → HTTP also works):", file: ".vscode/mcp.json", code: `{\n  "servers": {\n    "iconsdb": { "type": "http", "url": "${URL}" }\n  }\n}` },
      { text: "Click Start above the server entry, then use Agent mode in Copilot Chat." },
      { text: TRY },
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    steps: [
      { text: "Add to Cascade's MCP config:", file: "~/.codeium/windsurf/mcp_config.json", code: `{\n  "mcpServers": {\n    "iconsdb": { "serverUrl": "${URL}" }\n  }\n}` },
      { text: "Refresh servers from the Cascade MCP panel." },
      { text: TRY },
    ],
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    steps: [
      { text: "Add the server:", code: `gemini mcp add --transport http iconsdb ${URL}` },
      { text: "Or by hand:", file: "~/.gemini/settings.json", code: `{\n  "mcpServers": {\n    "iconsdb": { "httpUrl": "${URL}" }\n  }\n}` },
      { text: TRY },
    ],
  },
  {
    id: "zed",
    name: "Zed",
    steps: [
      { text: "Add a context server:", file: "~/.config/zed/settings.json", code: `{\n  "context_servers": {\n    "iconsdb": {\n      "source": "custom",\n      "url": "${URL}"\n    }\n  }\n}` },
      { text: TRY },
    ],
  },
  {
    id: "other",
    name: "Other",
    steps: [
      { text: "Any client that supports remote MCP over Streamable HTTP can connect to:", code: URL },
      { text: "No auth. Rate-limited per IP. Test it with the MCP Inspector:", code: `npx @modelcontextprotocol/inspector --transport http --server-url ${URL}` },
    ],
  },
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

const ENDPOINTS = [
  {
    path: "/api/v1/search?q=shopping+cart&mode=hybrid&limit=50&prefixes=lucide,tabler",
    desc: "Search icons. mode is hybrid (default), keyword or semantic. prefixes optionally restricts to a comma separated list of sets. Returns { icons: [{ prefix, name, score }] }.",
  },
  {
    path: "/api/v1/icon/lucide/shopping-cart.svg?color=%23ff0000&size=48",
    desc: "Render an icon as SVG. Optional color (hex/name), width/height/size, and download (sends Content-Disposition). Cached at the edge for a year.",
  },
  { path: "/api/v1/icons/lucide?icons=house,check,award", desc: "Raw icon data (Iconify format: body, width, height, transforms) for up to 200 icons from one set in a single request." },
  { path: "/api/v1/collections", desc: "List all icon sets with author, license (SPDX), homepage, style suffixes and sample icons." },
];

export default function InstallPage() {
  return (
    <main className="flex-1 pb-16">
      <PageHeader crumbs={[{ href: "/", label: "Search" }]} title="Install" />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        <p className="text-fg-muted">
          Give your coding agent 146,000 open source icons. The IconsDB{" "}
          <a href="https://modelcontextprotocol.io" className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
            MCP
          </a>{" "}
          server searches by meaning and answers with the exact import for the icon package already in your{" "}
          <code className="font-mono text-sm">package.json</code>. Remote, no install, no API key.
        </p>

        <div className="mt-6 rounded-2xl border bg-bg-elevated p-5">
          <div className="text-xs uppercase tracking-wide text-fg-subtle">MCP endpoint</div>
          <code className="mt-1 block font-mono text-lg">{URL}</code>
        </div>

        <h2 className="mt-10 text-lg font-medium">Set up your agent</h2>
        <div className="mt-3">
          <AgentTabs agents={AGENTS} />
        </div>

        <h2 className="mt-12 text-lg font-medium">What the agent can do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
          <li>
            <span className="text-fg">Intent search.</span> &ldquo;a shopping cart&rdquo;, &ldquo;log out&rdquo;, &ldquo;a lady cooking&rdquo; — hybrid keyword +
            semantic ranking across 57 sets.
          </li>
          <li>
            <span className="text-fg">Package-aware.</span> If the project uses <code className="font-mono text-sm">lucide-react</code>, every result is a paste-ready
            import: <code className="font-mono text-sm">{'import { House } from "lucide-react"'}</code>. Knows Heroicons, Tabler, Phosphor, Remix, Bootstrap, MDI, Font
            Awesome, Octicons, Radix, Simple Icons, react-icons and more; falls back to <code className="font-mono text-sm">@iconify/react</code> or an inline component.
          </li>
          <li>
            <span className="text-fg">Consistency.</span> Ask for several concepts at once and it reports which single set covers all of them, so a nav bar doesn&apos;t mix
            three icon styles.
          </li>
          <li>
            <span className="text-fg">Small responses.</span> Ten grouped rows per query, SVG only when asked, licence and attribution on every answer.
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

        <h2 className="mt-10 text-lg font-medium">Example session</h2>
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

        <h2 id="api" className="mt-14 text-lg font-medium">
          REST API
        </h2>
        <p className="mt-2 text-fg-muted">
          The same search and rendering as a free, CORS-enabled JSON/SVG API. No key; rate limited per IP (120/min). Icons keep their original licences — see{" "}
          <Link href="/licenses" className="underline decoration-line hover:text-fg">
            licenses
          </Link>
          .
        </p>
        <div className="mt-6 space-y-6">
          {ENDPOINTS.map((e) => (
            <div key={e.path}>
              <code className="block break-all font-mono text-sm">
                <span className="mr-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent dark:text-[#d2e3fc]">GET</span>
                <a href={e.path} className="hover:underline">
                  {e.path}
                </a>
              </code>
              <p className="mt-1.5 text-sm text-fg-muted">{e.desc}</p>
            </div>
          ))}
        </div>
        <TrademarkNotice className="mt-10" />
      </div>
    </main>
  );
}
