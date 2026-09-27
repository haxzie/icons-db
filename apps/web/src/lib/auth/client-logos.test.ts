import { describe, expect, it } from "vitest";
import { presetIconFor } from "./client-logos";

describe("presetIconFor", () => {
  it("matches the names MCP clients actually register with", () => {
    expect(presetIconFor("Claude Code")).toEqual({ prefix: "logos", name: "claude-icon" });
    expect(presetIconFor("Cursor")).toEqual({ prefix: "logos", name: "cursor-icon" });
    expect(presetIconFor("Visual Studio Code")).toEqual({ prefix: "logos", name: "visual-studio-code" });
    expect(presetIconFor("Zed")).toEqual({ prefix: "simple-icons", name: "zedindustries" });
  });

  it("ignores case, spacing and punctuation", () => {
    const claude = { prefix: "logos", name: "claude-icon" };
    expect(presetIconFor("claude-code")).toEqual(claude);
    expect(presetIconFor("claude_desktop")).toEqual(claude);
    expect(presetIconFor("  CLAUDE   CODE  ")).toEqual(claude);
  });

  it("prefers the more specific app over a broader brand match", () => {
    // "GitHub Copilot" contains neither "vscode" nor "code" first — Copilot is
    // listed ahead of VS Code so it can't be swallowed by the "code" needle.
    expect(presetIconFor("GitHub Copilot")).toEqual({ prefix: "logos", name: "github-copilot" });
    // …and "Claude Code" must not fall through to VS Code either.
    expect(presetIconFor("Claude Code")).toEqual({ prefix: "logos", name: "claude-icon" });
  });

  it("returns null for apps we don't know", () => {
    expect(presetIconFor("Some Internal Agent")).toBeNull();
    expect(presetIconFor("")).toBeNull();
    expect(presetIconFor("!!!")).toBeNull();
  });
});
