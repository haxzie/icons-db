import { describe, expect, it } from "vitest";
import { rewriteMarkup, scopeStylesheet } from "../src/dither-motion";

describe("rewriteMarkup", () => {
  it("turns part markers into classes and drops the rest of the hooks", () => {
    expect(rewriteMarkup('<g data-part="shell" data-icon="bell"><path d="M0 0"/></g>')).toBe(
      '<g class="di-part di-p-shell"><path d="M0 0"/></g>',
    );
  });

  it("drops the root's own class, aria and role attributes", () => {
    expect(rewriteMarkup('<svg class="di-icon " role="img" aria-hidden="true" data-animate="true"><path/></svg>')).toBe("<svg><path/></svg>");
  });
});

describe("scopeStylesheet", () => {
  const sheet = [
    ".di-part{transform-box:fill-box}",
    '.di-icon[data-icon="bell"] [data-part="shell"]{transform-origin:12px 5px}',
    '.di-icon[data-icon="bell"][data-animate=true]:not([data-motion-runtime=true]):is(:hover,:focus-visible) [data-part="shell"],',
    '.di-trigger:is(:hover,:focus-visible) .di-icon[data-icon="bell"][data-animate=true] [data-part="shell"]{animation:di-bell-shell 940ms linear both}',
    "@keyframes di-bell-shell{0%{transform:rotate(0)}100%{transform:rotate(9deg)}}",
    "@keyframes di-unused{0%{opacity:0}}",
  ].join("");

  it("rewrites the runtime hooks onto the class the body carries", () => {
    const out = scopeStylesheet(sheet, "bell");
    expect(out).toContain(".di-icon.di-i-bell .di-p-shell{transform-origin:12px 5px}");
    expect(out).toContain(".di-icon.di-i-bell:is(:hover,:focus-visible) .di-p-shell{animation:di-bell-shell 940ms linear both}");
    expect(out).not.toContain("data-");
  });

  it("keeps a comma inside :is() rather than splitting the selector there", () => {
    // Splitting on that comma used to emit ":focus-visible) .di-part{…}", which
    // parses as nothing. Balanced brackets in every selector is the invariant.
    for (const selector of scopeStylesheet(sheet, "bell").split("}").map((r) => r.split("{")[0])) {
      const open = (selector.match(/\(/g) ?? []).length;
      const close = (selector.match(/\)/g) ?? []).length;
      expect({ selector, open, close }).toEqual({ selector, open: close, close });
    }
  });

  it("drops the .di-trigger branch, which needs an ancestor a body cannot have", () => {
    expect(scopeStylesheet(sheet, "bell")).not.toContain("di-trigger");
  });

  it("keeps only the keyframes the surviving rules reference", () => {
    const out = scopeStylesheet(sheet, "bell");
    expect(out).toContain("@keyframes di-bell-shell");
    expect(out).not.toContain("di-unused");
  });

  it("drops rules belonging to a different icon", () => {
    expect(scopeStylesheet(sheet, "heart")).not.toContain("di-bell-shell");
  });

  it("drops the generic rules, which exclude crafted icons — and all of them are", () => {
    const generic = '.di-icon:not([data-crafted=true])[data-animate=true]:is(:hover,:focus-visible) .di-part{animation-name:var(--di-motion)}';
    expect(scopeStylesheet(generic, "bell")).toBe("");
  });

  it("rewrites inside a grouping at-rule and keeps the wrapper", () => {
    const media = "@media(prefers-reduced-motion:reduce){.di-icon [data-part]{animation:none!important}}";
    expect(scopeStylesheet(media, "bell")).toBe("@media(prefers-reduced-motion:reduce){.di-icon .di-part{animation:none!important}}");
  });
});
