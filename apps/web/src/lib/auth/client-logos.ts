/**
 * Known MCP clients, mapped to icons from our own sets.
 *
 * A registered `logo_uri` is whatever the client put there — it can be missing,
 * stale, or a 404, and for well-known apps we already host a better mark. So the
 * preset wins, and the registered URL is only a fallback for clients we don't
 * recognise.
 *
 * Order matters: the first match wins, so "claude code" must be listed before
 * the broader "claude".
 */
type PresetIcon = { prefix: string; name: string };

const PRESETS: ReadonlyArray<{ match: readonly string[]; icon: PresetIcon }> = [
  { match: ["claudecode", "claudedesktop", "claudeai", "claude", "anthropic"], icon: { prefix: "logos", name: "claude-icon" } },
  { match: ["cursor"], icon: { prefix: "logos", name: "cursor-icon" } },
  { match: ["githubcopilot", "copilot"], icon: { prefix: "logos", name: "github-copilot" } },
  { match: ["vscode", "visualstudiocode", "code"], icon: { prefix: "logos", name: "visual-studio-code" } },
  { match: ["codex", "chatgpt", "openai"], icon: { prefix: "logos", name: "openai-icon" } },
  { match: ["windsurf", "codeium"], icon: { prefix: "simple-icons", name: "windsurf" } },
  { match: ["geminicli", "gemini"], icon: { prefix: "logos", name: "google-gemini-icon" } },
  { match: ["zed"], icon: { prefix: "simple-icons", name: "zedindustries" } },
  { match: ["cline"], icon: { prefix: "simple-icons", name: "cline" } },
  { match: ["warp"], icon: { prefix: "simple-icons", name: "warp" } },
  { match: ["jetbrains", "intellij", "webstorm", "pycharm", "goland", "rider"], icon: { prefix: "logos", name: "jetbrains" } },
  { match: ["raycast"], icon: { prefix: "simple-icons", name: "raycast" } },
  { match: ["postman"], icon: { prefix: "simple-icons", name: "postman" } },
  { match: ["obsidian"], icon: { prefix: "simple-icons", name: "obsidian" } },
  { match: ["figma"], icon: { prefix: "logos", name: "figma" } },
  { match: ["n8n"], icon: { prefix: "logos", name: "n8n" } },
  { match: ["sourcegraph", "amp"], icon: { prefix: "simple-icons", name: "sourcegraph" } },
];

/** Icon for a registered client name, or null when we don't recognise the app. */
export function presetIconFor(clientName: string): PresetIcon | null {
  const normalized = clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) return null;
  for (const { match, icon } of PRESETS) {
    if (match.some((needle) => normalized.includes(needle))) return icon;
  }
  return null;
}
