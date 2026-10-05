import { describe, expect, it } from "vitest";
import {
  buildRasterSnippets,
  DEFAULT_RASTER_SIZE,
  DEFAULT_RASTER_VARIANT,
  isRasterRef,
  isRasterSize,
  isRasterVariant,
  rasterKey,
  rasterUrl,
} from "../src";

describe("rasterUrl", () => {
  it("omits the defaults so the common case caches under one key", () => {
    expect(rasterUrl("app-icons", "netflix")).toBe("/api/v1/icon/app-icons/netflix.png");
    expect(rasterUrl("app-icons", "netflix", { size: DEFAULT_RASTER_SIZE, variant: DEFAULT_RASTER_VARIANT })).toBe(
      "/api/v1/icon/app-icons/netflix.png",
    );
  });

  it("spells out anything non-default", () => {
    expect(rasterUrl("app-icons", "netflix", { size: 1024 })).toBe("/api/v1/icon/app-icons/netflix.png?size=1024");
    expect(rasterUrl("app-icons", "netflix", { variant: "square" })).toBe("/api/v1/icon/app-icons/netflix.png?variant=square");
    expect(rasterUrl("app-icons", "netflix", { size: 512, variant: "square" })).toBe(
      "/api/v1/icon/app-icons/netflix.png?size=512&variant=square",
    );
  });

  it("marks downloads", () => {
    expect(rasterUrl("app-icons", "netflix", { download: true })).toBe("/api/v1/icon/app-icons/netflix.png?download=");
  });
});

describe("validators", () => {
  it("accepts only the sizes that were actually exported", () => {
    expect(isRasterSize(512)).toBe(true);
    expect(isRasterSize(999)).toBe(false);
    expect(isRasterSize("512")).toBe(false);
    expect(isRasterSize(undefined)).toBe(false);
  });

  it("accepts only the two shapes", () => {
    expect(isRasterVariant("rounded")).toBe(true);
    expect(isRasterVariant("square")).toBe(true);
    expect(isRasterVariant("squircle")).toBe(false);
    expect(isRasterVariant(null)).toBe(false);
  });

  it("tells a raster pointer from Iconify data", () => {
    expect(isRasterRef({ raster: true, width: 1024, height: 1024, png: "/x.png" })).toBe(true);
    expect(isRasterRef({ body: "<path/>", width: 24, height: 24 })).toBe(false);
    expect(isRasterRef(null)).toBe(false);
    expect(isRasterRef(undefined)).toBe(false);
  });
});

describe("rasterKey", () => {
  it("matches the layout the upload script writes", () => {
    expect(rasterKey("app-icons", "netflix", "rounded", 256)).toBe("raster/app-icons/rounded/256/netflix.png");
  });
});

describe("buildRasterSnippets", () => {
  const snippets = buildRasterSnippets({
    prefix: "app-icons",
    name: "netflix",
    label: "Netflix",
    origin: "https://iconsdb.app",
    size: 512,
    variant: "square",
  });
  const byKind = Object.fromEntries(snippets.map((s) => [s.kind, s.code]));

  it("offers only formats a PNG can actually satisfy", () => {
    expect(snippets.map((s) => s.kind)).toEqual(["html", "react", "css", "markdown", "url"]);
  });

  it("carries the selected size and variant into every snippet", () => {
    for (const code of Object.values(byKind)) {
      expect(code).toContain("size=512&variant=square");
      expect(code).toContain("https://iconsdb.app");
    }
  });

  it("uses background rather than a mask, which a PNG cannot be", () => {
    expect(byKind.css).toContain("background:");
    expect(byKind.css).not.toContain("mask");
  });

  it("labels the image with the app's real name", () => {
    expect(byKind.html).toContain('alt="Netflix icon"');
    expect(byKind.markdown).toBe("![Netflix icon](https://iconsdb.app/api/v1/icon/app-icons/netflix.png?size=512&variant=square)");
  });
});
