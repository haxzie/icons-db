import type { Metadata } from "next";
import Link from "next/link";
import { IconGlyph } from "@/components/IconGlyph";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import { AgentTabs, type AgentGuide } from "@/components/install/AgentTabs";
import { CopyButton } from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Install — MCP server for coding agents",
  description:
    "Connect Claude Code, Cursor, Codex, VS Code, Windsurf, Gemini CLI or Zed to 146,000 open source icons. Remote MCP server with semantic search and paste-ready imports.",
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

const EXAMPLE = `> Add home, settings and log-out icons to the sidebar using our existing icon library.

detect_icon_packages(["react", "next", "lucide-react"])
  → lucide-react (react) → sets: lucide

search_icons({ queries: ["home", "settings", "log out"], package: "lucide-react" })
  → Sets covering all 3 concepts: lucide
    home → lucide:house · settings → lucide:settings · log out → lucide:log-out

get_icons({ ids: ["lucide:house", "lucide:settings", "lucide:log-out"], format: "react" })
  → import { House } from "lucide-react";
    import { Settings } from "lucide-react";
    import { LogOut } from "lucide-react";
    License: ISC — free for commercial use, no attribution`;

const AGENT_LOGOS = [
  { prefix: "logos", id: "claude-icon", name: "Claude Code" },
  { prefix: "logos", id: "cursor-icon", name: "Cursor" },
  { prefix: "logos", id: "openai-icon", name: "Codex" },
  { prefix: "logos", id: "visual-studio-code", name: "VS Code" },
  { prefix: "simple-icons", id: "windsurf", name: "Windsurf" },
  { prefix: "logos", id: "google-gemini-icon", name: "Gemini CLI" },
  { prefix: "simple-icons", id: "zedindustries", name: "Zed" },
];

export default function InstallPage() {
  return (
    <main className="flex-1 pb-16">
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 md:px-8">
        <div className="flex justify-center">
          {AGENT_LOGOS.map((a, i) => (
            <span
              key={a.id}
              title={a.name}
              className="grid size-12 place-items-center rounded-full border-2 border-bg bg-bg-elevated text-fg transition hover:z-10 hover:-translate-y-1"
              style={{ marginLeft: i ? -10 : 0, zIndex: AGENT_LOGOS.length - i }}
            >
              <IconGlyph prefix={a.prefix} name={a.id} className="size-5" />
            </span>
          ))}
        </div>
        <h1 className="mt-6 text-center text-[32px] font-medium leading-tight tracking-tight">Install IconsDB for your agents</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-fg-muted">
          Give your coding agent 146,000 open source icons. The IconsDB{" "}
          <a href="https://modelcontextprotocol.io" className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
            MCP
          </a>{" "}
          server searches by meaning and answers with the exact import for the icon package already in your{" "}
          <code className="font-mono text-sm">package.json</code>. Remote, no install, no API key.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-bg-elevated p-5">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-fg-subtle">MCP endpoint</div>
            <code className="mt-1 block truncate font-mono text-lg">{URL}</code>
          </div>
          <CopyButton text={URL} label="Copy endpoint" />
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
        <div className="relative mt-3">
          <pre className="overflow-x-auto rounded-2xl border bg-bg-elevated p-4 pr-14 font-mono text-[13px] leading-relaxed">{EXAMPLE}</pre>
          <CopyButton text={EXAMPLE} className="absolute right-2 top-2" />
        </div>

        <p className="mt-10 text-sm text-fg-muted">
          Icons keep their original licences — see{" "}
          <Link href="/licenses" className="underline decoration-line hover:text-fg">
            licenses
          </Link>
          .
        </p>
        <TrademarkNotice className="mt-10" />
      </div>
    </main>
  );
}
