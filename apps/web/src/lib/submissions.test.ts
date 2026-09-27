import { describe, expect, it } from "vitest";
import { normalizeRepo, normalizeTwitter, normalizeWebsite, validateSubmission } from "./submissions";

describe("normalizeRepo", () => {
  it("canonicalises the shapes people actually paste", () => {
    for (const input of [
      "https://github.com/lucide-icons/lucide",
      "http://github.com/lucide-icons/lucide",
      "https://www.github.com/lucide-icons/lucide",
      "github.com/lucide-icons/lucide",
      "https://github.com/lucide-icons/lucide/",
      "https://github.com/lucide-icons/lucide.git",
      "https://github.com/lucide-icons/lucide?tab=readme",
    ]) {
      expect(normalizeRepo(input), input).toBe("https://github.com/lucide-icons/lucide");
    }
  });

  it("keeps dots and hyphens in the repo name", () => {
    expect(normalizeRepo("github.com/foo/icons.js")).toBe("https://github.com/foo/icons.js");
    expect(normalizeRepo("github.com/my-org/my-icons")).toBe("https://github.com/my-org/my-icons");
  });

  it("rejects anything that isn't an owner/repo on github.com", () => {
    for (const input of [
      "",
      "not a url",
      "https://gitlab.com/foo/bar",
      "https://github.com/lucide-icons",
      "https://github.com",
      "https://evil.com/github.com/foo/bar",
      "https://github.com.evil.com/foo/bar",
      "https://github.com/-bad/repo",
      "javascript:alert(1)",
    ]) {
      expect(normalizeRepo(input), input).toBeNull();
    }
  });
});

describe("normalizeWebsite", () => {
  it("accepts and tidies absolute and scheme-less URLs", () => {
    expect(normalizeWebsite("lucide.dev")).toBe("https://lucide.dev");
    expect(normalizeWebsite("https://lucide.dev/")).toBe("https://lucide.dev");
    expect(normalizeWebsite("https://lucide.dev/icons")).toBe("https://lucide.dev/icons");
  });

  it("rejects non-http schemes and unreachable hosts", () => {
    expect(normalizeWebsite("javascript:alert(1)")).toBeNull();
    expect(normalizeWebsite("localhost")).toBeNull();
    expect(normalizeWebsite("")).toBeNull();
  });
});

describe("normalizeTwitter", () => {
  it("reduces every form to the bare handle", () => {
    for (const input of ["haxzie", "@haxzie", "https://x.com/haxzie", "https://twitter.com/haxzie", "x.com/haxzie/"]) {
      expect(normalizeTwitter(input), input).toBe("haxzie");
    }
  });

  it("rejects other hosts and impossible handles", () => {
    expect(normalizeTwitter("https://facebook.com/haxzie")).toBeNull();
    expect(normalizeTwitter("a".repeat(16))).toBeNull();
    expect(normalizeTwitter("has space")).toBeNull();
  });
});

describe("validateSubmission", () => {
  const base = { repo: "github.com/foo/bar", website: "", twitter: "" };

  it("requires only the repo, and normalises what it gets", () => {
    const result = validateSubmission({ repo: "github.com/foo/bar", website: "foo.dev", twitter: "@foo" });
    expect(result).toEqual({ ok: true, value: { repo: "https://github.com/foo/bar", website: "https://foo.dev", twitter: "foo" } });
  });

  it("treats blank optional fields as empty, not invalid", () => {
    const result = validateSubmission(base);
    expect(result).toEqual({ ok: true, value: { repo: "https://github.com/foo/bar", website: "", twitter: "" } });
  });

  it("reports a missing repo differently from a malformed one", () => {
    expect(validateSubmission({ ...base, repo: "  " })).toMatchObject({ ok: false, errors: { repo: "A GitHub repository URL is required." } });
    expect(validateSubmission({ ...base, repo: "https://gitlab.com/a/b" })).toMatchObject({ ok: false, errors: { repo: "That doesn't look like a GitHub repository URL." } });
  });

  it("collects every field error at once", () => {
    const result = validateSubmission({ repo: "nope", website: "javascript:alert(1)", twitter: "way too long a handle" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["repo", "twitter", "website"]);
  });
});
