import { describe, expect, it } from "vitest";
import {
  buildKeywordIndex,
  buildTextMap,
  decodeEmbeddings,
  encodeEmbeddings,
  expandTextHits,
  freezeAnimations,
  isAnimated,
  mergeHits,
  searchKeyword,
  splitVariant,
  staticFrame,
  styleBucket,
  topTexts,
  type SearchIndexData,
} from "../src";

const data: SearchIndexData = {
  v: 1,
  prefixes: [
    { prefix: "lucide", name: "Lucide", suffixes: { "": "Outline" } },
    { prefix: "ph", name: "Phosphor", suffixes: { "": "Regular", bold: "Bold", fill: "Fill", duotone: "Duotone" } },
  ],
  categories: [],
  icons: [
    [0, "shopping-cart", 0, -1],
    [0, "trash", 1, -1],
    [0, "trash-2", 1, -1],
    [1, "shopping-cart", 0, -1],
    [1, "shopping-cart-bold", 0, -1],
    [1, "trash-fill", 1, -1],
    [0, "delete", 1, -1, 1], // alias of trash
  ],
};

describe("splitVariant", () => {
  it("strips the longest matching suffix", () => {
    expect(splitVariant("home-outline-rounded", { "": "Regular", outline: "Outline", "outline-rounded": "Outline Rounded" })).toEqual({
      family: "home",
      style: "Outline Rounded",
      suffix: "outline-rounded",
    });
  });
  it("falls back to the default style", () => {
    expect(splitVariant("home", { "": "Regular", fill: "Fill" }).style).toBe("Regular");
  });
  it("does not strip a suffix that is the whole name", () => {
    expect(splitVariant("fill", { "": "Regular", fill: "Fill" }).family).toBe("fill");
  });
  it("buckets styles", () => {
    expect(styleBucket("Bold Duotone")).toBe("duotone");
    expect(styleBucket("Solid 20x20")).toBe("filled");
    expect(styleBucket("Thin")).toBe("light");
    expect(styleBucket("Outline")).toBe("outline");
  });
});

describe("keyword search", () => {
  const index = buildKeywordIndex(data);
  it("ranks exact name first and collapses aliases onto parents", () => {
    const hits = searchKeyword(index, "trash");
    expect(hits[0].name).toBe("trash");
    expect(hits.map((h) => h.name)).not.toContain("delete");
    expect(hits.map((h) => h.name)).toContain("trash-2");
  });
  it("finds parents through alias names", () => {
    const hits = searchKeyword(index, "delete");
    // "delete" reaches `trash` twice over: as an alias of it, and as a synonym.
    // The synonym then prefix-matches the rest of the family, so the whole
    // trash family comes back — which is what someone typing "delete" wants.
    expect(hits[0].name).toBe("trash");
    // The alias is never its own result; it collapses onto its parent.
    expect(hits.map((h) => h.name)).not.toContain("delete");
    expect(hits.map((h) => h.name)).toEqual(expect.arrayContaining(["trash-2", "trash-fill"]));
    // The direct hit must stay well clear of the synonym-only matches.
    expect(hits[0].score).toBeGreaterThan(hits[1].score * 2);
  });
  it("requires every query token to match", () => {
    expect(searchKeyword(index, "shopping cart").map((h) => h.name)).toEqual(
      expect.arrayContaining(["shopping-cart", "shopping-cart-bold"]),
    );
    expect(searchKeyword(index, "shopping bike")).toHaveLength(0);
  });
  it("prefix-matches tokens", () => {
    expect(searchKeyword(index, "sho").length).toBe(3);
  });
});

describe("embeddings", () => {
  it("round-trips quantised vectors and ranks by cosine", () => {
    const vecs = [Float32Array.from([1, 0, 0]), Float32Array.from([0, 1, 0]), Float32Array.from([0.7, 0.7, 0])];
    const m = decodeEmbeddings(encodeEmbeddings(vecs, 3));
    expect(m.count).toBe(3);
    const top = topTexts(m, Float32Array.from([1, 0, 0]), 2);
    expect(top[0].textId).toBe(0);
    expect(top[0].score).toBeCloseTo(1, 2);
    expect(top[1].textId).toBe(2);
  });
  it("expands text hits to icons, skipping aliases", () => {
    const hits = expandTextHits(data, buildTextMap(data), [{ textId: 1, score: 0.9 }], 10);
    expect(hits.map((h) => `${h.prefix}:${h.name}`)).toEqual(["lucide:trash", "lucide:trash-2", "ph:trash-fill"]);
  });
});

describe("mergeHits", () => {
  it("boosts icons present in both lists", () => {
    const merged = mergeHits(
      [{ idx: 1, prefix: "lucide", name: "trash", score: 2 }, { idx: 2, prefix: "lucide", name: "trash-2", score: 1.5 }],
      [{ idx: 2, prefix: "lucide", name: "trash-2", score: 0.9 }, { idx: 5, prefix: "ph", name: "trash-fill", score: 0.8 }],
    );
    expect(merged[0].name).toBe("trash-2");
    expect(merged.map((h) => h.name)).toContain("trash-fill");
  });
});

describe("isAnimated", () => {
  it("detects SMIL animation elements", () => {
    expect(isAnimated('<path d="M0 0"><animate attributeName="opacity" to="1"/></path>')).toBe(true);
    expect(isAnimated('<circle r="2"><animateTransform type="rotate" to="360"/></circle>')).toBe(true);
    expect(isAnimated('<path d="M0 0"><set attributeName="d" to="M1 1"/></path>')).toBe(true);
    expect(isAnimated("<style>@keyframes spin{to{rotate:360deg}}</style><path/>")).toBe(true);
  });

  it("does not fire on static bodies or on lookalike names", () => {
    expect(isAnimated('<path fill="currentColor" d="M0 0h24v24H0z"/>')).toBe(false);
    expect(isAnimated('<path class="animate-pulse" data-animated="no"/>')).toBe(false);
  });
});

describe("freezeAnimations", () => {
  it("applies the end value of a freezing animation to its parent", () => {
    const out = freezeAnimations(
      '<path stroke-dashoffset="28" d="M0 0"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="28;0"/></path>',
    );
    expect(out).toBe('<path stroke-dashoffset="0" d="M0 0"></path>');
  });

  it("prefers `to` and adds the attribute when the parent lacks it", () => {
    const out = freezeAnimations('<path d="M0 0"><animate fill="freeze" attributeName="fill-opacity" to="1"/></path>');
    expect(out).toBe('<path d="M0 0" fill-opacity="1"></path>');
  });

  it("lets the last animation on an attribute win", () => {
    const out = freezeAnimations(
      '<path d="M0 0"><set fill="freeze" attributeName="d" to="M1 1"/><set fill="freeze" attributeName="d" to="M2 2"/></path>',
    );
    expect(out).toBe('<path d="M2 2"></path>');
  });

  it("reverts to the base value when the animation does not freeze", () => {
    expect(freezeAnimations('<circle r="4"><animate attributeName="r" repeatCount="indefinite" values="4;8"/></circle>')).toBe(
      '<circle r="4"></circle>',
    );
    expect(
      freezeAnimations('<circle r="4"><animateTransform fill="freeze" attributeName="transform" type="rotate" repeatCount="indefinite" values="0;360"/></circle>'),
    ).toBe('<circle r="4"></circle>');
  });

  it("lets a replacing animateTransform drop the base transform, as SMIL does", () => {
    const out = freezeAnimations(
      '<g transform="translate(2 2)"><animateTransform fill="freeze" attributeName="transform" type="rotate" to="90 12 12"/></g>',
    );
    expect(out).toBe('<g transform="rotate(90 12 12)"></g>');
  });

  it("composes an additive animateTransform onto the base transform", () => {
    const out = freezeAnimations(
      '<g transform="translate(2 2)"><animateTransform additive="sum" fill="freeze" attributeName="transform" type="scale" to="2"/></g>',
    );
    expect(out).toBe('<g transform="translate(2 2) scale(2)"></g>');
  });

  it("resolves a straight-line animateMotion to its end point", () => {
    const out = freezeAnimations(
      '<path transform="translate(0 22)" d="M0 0"><animateMotion fill="freeze" calcMode="linear" dur="0.6s" path="M0 0v-22"/></path>',
    );
    expect(out).toBe('<path transform="translate(0 22) translate(0 -22)" d="M0 0"></path>');
  });

  it("drops motion it cannot resolve rather than guessing", () => {
    const out = freezeAnimations('<path d="M0 0"><animateMotion fill="freeze" path="M0 0c1 1 2 2 3 3"/></path>');
    expect(out).toBe('<path d="M0 0"></path>');
  });

  it("handles nesting, long-form animation tags and leaves static markup alone", () => {
    const out = freezeAnimations(
      '<defs><mask id="a"><path d="M0 0"><animate fill="freeze" attributeName="opacity" to="1"></animate></path></mask></defs><path mask="url(#a)" d="M1 1"/>',
    );
    expect(out).toBe('<defs><mask id="a"><path d="M0 0" opacity="1"></path></mask></defs><path mask="url(#a)" d="M1 1"/>');
  });

  it("returns CSS-animated bodies untouched", () => {
    const css = "<style>@keyframes spin{to{rotate:360deg}}</style><path/>";
    expect(freezeAnimations(css)).toBe(css);
  });
});

describe("staticFrame", () => {
  it("picks the drawn frame, not the blank one, for a reverse animation", () => {
    // line-md's "-out" icons animate from drawn to hidden: the final frame is empty.
    const body = '<path stroke-dasharray="20" d="M0 0"><animate fill="freeze" attributeName="stroke-dashoffset" values="0;20"/></path>';
    expect(freezeAnimations(body)).toBe('<path stroke-dasharray="20" d="M0 0" stroke-dashoffset="20"></path>');
    expect(staticFrame(body)).toBe('<path stroke-dasharray="20" d="M0 0" stroke-dashoffset="0"></path>');
  });

  it("resolves a looping animation that never freezes", () => {
    const body = '<circle r="0" opacity="0"><animate attributeName="r" repeatCount="indefinite" values="0;8"/><animate attributeName="opacity" repeatCount="indefinite" values="0;1"/></circle>';
    expect(freezeAnimations(body)).toBe('<circle r="0" opacity="0"></circle>');
    expect(staticFrame(body)).toBe('<circle r="8" opacity="1"></circle>');
  });

  it("escapes a collapsed placeholder transform (the svg-spinners pulse-ring idiom)", () => {
    const body =
      '<path transform="matrix(0 0 0 0 12 12)" d="M0 0"><animateTransform attributeName="transform" repeatCount="indefinite" type="translate" values="12 12;0 0"/><animateTransform additive="sum" attributeName="transform" repeatCount="indefinite" type="scale" values="0;1"/><animate attributeName="opacity" repeatCount="indefinite" values="1;0"/></path>';
    expect(staticFrame(body)).toBe('<path transform="translate(0 0) scale(1)" d="M0 0" opacity="1"></path>');
  });
});
