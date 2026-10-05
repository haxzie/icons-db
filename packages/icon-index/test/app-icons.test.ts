import { describe, expect, it } from "vitest";
import { loadAppIcons, loadManifest, APP_ICONS_PREFIX } from "../src/app-icons";

const loaded = await loadAppIcons();
const manifest = await loadManifest();

describe("loadAppIcons", () => {
  it("produces one icon per app in the manifest", () => {
    expect(loaded.icons).toHaveLength(manifest.apps.length);
    expect(loaded.collection.total).toBe(manifest.apps.length);
  });

  it("marks every icon raster with an empty body", () => {
    // The body column is NOT NULL and holds SVG for every other set; a raster
    // row stores '' and the flag is what readers branch on. If this ever
    // regresses, the grid renders 500 blank SVGs rather than failing loudly.
    for (const icon of loaded.icons) {
      expect(icon.raster).toBe(true);
      expect(icon.body).toBe("");
      expect(icon.animated).toBe(false);
    }
  });

  it("gives each app a unique slug usable as a URL segment", () => {
    const names = loaded.icons.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("carries the App Store genre through as the category", () => {
    const youtube = loaded.icons.find((i) => i.name === "youtube");
    expect(youtube?.category).toBe("Photo & Video");
  });

  it("describes the set as unlicensed rather than leaving it Unknown", () => {
    const { collection } = loaded;
    expect(collection.prefix).toBe(APP_ICONS_PREFIX);
    expect(collection.kind).toBe("apps");
    expect(collection.raster).toBe(true);
    expect(collection.license.spdx).toBeUndefined();
    expect(collection.license.title).toMatch(/trademark/i);
  });

  it("is restricted, not attribution-required", () => {
    // `attribution` has two states and both promise an open licence: "credit
    // the author" or "free for commercial use, no credit needed". Claiming
    // either put "Attribution required." under a set that has no licence.
    const { license } = loaded.collection;
    expect(license.restricted).toBe(true);
    expect(license.attribution).toBe(false);
  });

  it("gives the badge something that fits in a pill", () => {
    const { license } = loaded.collection;
    expect(license.badge).toBeDefined();
    expect(license.badge!.length).toBeLessThan(16);
    expect(license.title.length).toBeGreaterThan(license.badge!.length);
  });

  it("only advertises samples that exist in the set", () => {
    for (const s of loaded.collection.samples) {
      expect(loaded.icons.some((i) => i.name === s)).toBe(true);
    }
  });

  it("has no style variants, so every icon is its own family", () => {
    for (const icon of loaded.icons) expect(icon.family).toBe(icon.name);
  });
});
