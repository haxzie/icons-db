import { describe, expect, it } from "vitest";
import { resolveName } from "./name";

describe("resolveName", () => {
  it("prefers the provider's display name", () => {
    expect(resolveName({ name: "Ada Lovelace", login: "ada", email: "ada@example.com" })).toBe("Ada Lovelace");
  });

  it("falls back to the GitHub login when the profile name is blank", () => {
    expect(resolveName({ name: "   ", login: "haxzie", email: "h@example.com" })).toBe("haxzie");
  });

  it("derives a name from the email for magic-link signups", () => {
    expect(resolveName({ email: "ada.lovelace@example.com" })).toBe("Ada Lovelace");
    expect(resolveName({ email: "ada_lovelace99@example.com" })).toBe("Ada Lovelace");
    expect(resolveName({ email: "ada+icons@example.com" })).toBe("Ada");
  });

  it("collapses whitespace and caps absurd names", () => {
    expect(resolveName({ name: "  Ada   Lovelace  " })).toBe("Ada Lovelace");
    expect(resolveName({ name: "x".repeat(200) })).toHaveLength(80);
  });

  it("never returns an empty name", () => {
    expect(resolveName({})).toBe("IconsDB user");
    expect(resolveName({ name: null, login: null, email: "123@example.com" })).toBe("IconsDB user");
  });
});
