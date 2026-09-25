import { describe, expect, it } from "vitest";
import {
  buildKeywordIndex,
  buildTextMap,
  decodeEmbeddings,
  encodeEmbeddings,
  expandTextHits,
  mergeHits,
  searchKeyword,
  splitVariant,
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
