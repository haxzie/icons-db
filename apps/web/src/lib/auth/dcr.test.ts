import { describe, expect, it } from "vitest";
import { isHttpLoopback, withNativeApplicationType } from "./dcr";

describe("isHttpLoopback", () => {
  it("accepts the loopback forms MCP clients actually use", () => {
    expect(isHttpLoopback("http://127.0.0.1:41297/mcp-oauth/callback")).toBe(true);
    expect(isHttpLoopback("http://localhost:8976/callback")).toBe(true);
    expect(isHttpLoopback("http://[::1]:3000/callback")).toBe(true);
  });

  it("rejects anything that isn't an http loopback redirect", () => {
    // https loopback is invalid for native clients, so it must not be relabelled.
    expect(isHttpLoopback("https://127.0.0.1:41297/cb")).toBe(false);
    expect(isHttpLoopback("https://example.com/cb")).toBe(false);
    // Near-miss hosts that must not be treated as loopback.
    expect(isHttpLoopback("http://127.0.0.1.evil.com/cb")).toBe(false);
    expect(isHttpLoopback("http://localhost.evil.com/cb")).toBe(false);
    expect(isHttpLoopback("http://169.254.169.254/cb")).toBe(false);
    expect(isHttpLoopback("not a url")).toBe(false);
    expect(isHttpLoopback(undefined)).toBe(false);
  });
});

describe("withNativeApplicationType", () => {
  const loopback = ["http://127.0.0.1:41297/mcp-oauth/callback"];

  it("labels a loopback-only client as native", () => {
    expect(withNativeApplicationType({ redirect_uris: loopback })).toEqual({
      redirect_uris: loopback,
      application_type: "native",
    });
  });

  it("leaves an explicit application_type alone", () => {
    expect(withNativeApplicationType({ redirect_uris: loopback, application_type: "web" })).toBeNull();
  });

  it("leaves hosted clients alone", () => {
    expect(withNativeApplicationType({ redirect_uris: ["https://app.example.com/cb"] })).toBeNull();
    expect(withNativeApplicationType({ redirect_uris: [...loopback, "https://app.example.com/cb"] })).toBeNull();
    expect(withNativeApplicationType({ redirect_uris: [] })).toBeNull();
    expect(withNativeApplicationType({})).toBeNull();
  });
});
