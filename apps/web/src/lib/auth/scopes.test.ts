import { describe, expect, it } from "vitest";
import { parseScopeList, withOfflineAccess } from "./scopes";

const CLIENT = ["openid", "profile", "email", "offline_access", "mcp:icons"];

describe("parseScopeList", () => {
  it("reads a JSON array", () => {
    expect(parseScopeList('["openid","mcp:icons"]')).toEqual(["openid", "mcp:icons"]);
  });

  it("reads space- and comma-separated strings", () => {
    expect(parseScopeList("openid mcp:icons")).toEqual(["openid", "mcp:icons"]);
    expect(parseScopeList("openid, mcp:icons")).toEqual(["openid", "mcp:icons"]);
  });

  it("is empty for nothing", () => {
    expect(parseScopeList(null)).toEqual([]);
    expect(parseScopeList("")).toEqual([]);
  });
});

describe("withOfflineAccess", () => {
  it("adds the scope MCP clients leave out", () => {
    expect(withOfflineAccess("mcp:icons", CLIENT)).toBe("mcp:icons offline_access");
  });

  it("leaves a request that already asks for it alone", () => {
    expect(withOfflineAccess("mcp:icons offline_access", CLIENT)).toBeNull();
  });

  it("leaves an omitted scope alone, since that means every registered scope", () => {
    expect(withOfflineAccess(null, CLIENT)).toBeNull();
    expect(withOfflineAccess("   ", CLIENT)).toBeNull();
  });

  it("won't ask for a scope the client never registered", () => {
    expect(withOfflineAccess("mcp:icons", ["openid", "mcp:icons"])).toBeNull();
    expect(withOfflineAccess("mcp:icons", [])).toBeNull();
  });
});
