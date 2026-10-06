import { describe, expect, it } from "vitest";
import type { CollectionMeta, IconRecord } from "@icons-db/core";
import {
  abs,
  blogJsonLd,
  breadcrumbJsonLd,
  collectionJsonLd,
  iconJsonLd,
  ICON_COUNT,
  itemList,
  OPEN_ICON_COUNT,
  OPEN_SET_COUNT,
  ORG_ID,
  pageJsonLd,
  SET_COUNT,
  SITE,
  SITE_DESCRIPTION,
  SITE_ID,
  SITE_TITLE,
} from "./seo";

const set: CollectionMeta = {
  prefix: "lucide",
  name: "Lucide",
  kind: "icons",
  total: 1925,
  author: { name: "Lucide Contributors", url: "https://github.com/lucide-icons/lucide" },
  license: { title: "ISC", spdx: "ISC", url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE", attribution: false },
  palette: false,
  raster: false,
  animated: 0,
  samples: [],
  suffixes: { "": "Outline" },
};

// The app icons are the only set whose "licence" link is our own terms page,
// stored relative — the one input that used to leak a relative URL into the
// graph.
const appSet: CollectionMeta = {
  ...set,
  prefix: "app-icons",
  name: "App Store Top 500",
  kind: "apps",
  total: 500,
  raster: true,
  license: { title: "Trademarks of their owners", url: "/licenses#app-icons", attribution: false, restricted: true },
};

const icon: IconRecord = {
  id: "lucide:house",
  prefix: "lucide",
  name: "house",
  body: "<path d=''/>",
  width: 24,
  height: 24,
  left: 0,
  top: 0,
  rotate: 0,
  hFlip: false,
  vFlip: false,
  family: "house",
  style: "Outline",
  category: "Buildings",
  aliases: ["home"],
  animated: false,
  raster: false,
};

type Node = Record<string, unknown>;

function byType(nodes: unknown[], type: string): Node {
  const found = nodes.find((n) => (n as Node)["@type"] === type);
  expect(found, `no ${type} node`).toBeDefined();
  return found as Node;
}

describe("site facts", () => {
  it("counts the restricted set in the totals but not in anything called open source", () => {
    expect(SET_COUNT).toBeGreaterThan(OPEN_SET_COUNT);
    expect(OPEN_ICON_COUNT).toBeLessThanOrEqual(ICON_COUNT);
    // The headline claim is the one number a reader can check, so it has to be
    // the open subset: the app icons are not open source.
    expect(SITE_TITLE).toContain(`${OPEN_ICON_COUNT.toLocaleString()}+ open source icons`);
    expect(SITE_DESCRIPTION).toContain(`${(OPEN_SET_COUNT - 8).toLocaleString()} more open source sets`);
  });

  it("rounds down, so the \"+\" never overstates", () => {
    expect(ICON_COUNT % 1000).toBe(0);
    expect(OPEN_ICON_COUNT % 1000).toBe(0);
  });
});

describe("abs", () => {
  it("absolutises site-relative paths and leaves absolute ones alone", () => {
    expect(abs("/licenses#app-icons")).toBe(`${SITE}/licenses#app-icons`);
    expect(abs("licenses")).toBe(`${SITE}/licenses`);
    expect(abs("/")).toBe(`${SITE}/`);
    expect(abs("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("breadcrumbJsonLd", () => {
  it("roots the trail at the home page and numbers it from 1", () => {
    const crumbs = breadcrumbJsonLd("/library/lucide", [
      { name: "Library", url: "/library" },
      { name: "Lucide", url: "/library/lucide" },
    ]);
    expect(crumbs.itemListElement.map((i) => [i.position, i.name, i.item])).toEqual([
      // The home crumb matches the canonical Next.js emits for "/".
      [1, "IconsDB", `${SITE}/`],
      [2, "Library", `${SITE}/library`],
      [3, "Lucide", `${SITE}/library/lucide`],
    ]);
    expect(crumbs["@id"]).toBe(`${SITE}/library/lucide#breadcrumb`);
  });
});

describe("itemList", () => {
  it("absolutises item urls and can report a total larger than the slice", () => {
    const list = itemList([{ url: "/icons/house", name: "House icons" }], { total: 4440 }) as Node;
    expect(list.numberOfItems).toBe(4440);
    expect((list.itemListElement as Node[])[0].url).toBe(`${SITE}/icons/house`);
  });

  it("falls back to the slice length", () => {
    expect((itemList([{ url: "/a", name: "A" }]) as Node).numberOfItems).toBe(1);
  });
});

describe("pageJsonLd", () => {
  it("wires the page to the site node and its own breadcrumbs", () => {
    const [page, crumbs] = pageJsonLd({ url: "/library", name: "Icon sets", crumbs: [{ name: "Library", url: "/library" }] }) as Node[];
    expect(page["@id"]).toBe(`${SITE}/library#page`);
    expect(page.isPartOf).toEqual({ "@id": SITE_ID });
    expect(page.breadcrumb).toEqual({ "@id": `${SITE}/library#breadcrumb` });
    expect(crumbs["@type"]).toBe("BreadcrumbList");
  });

  it("omits the breadcrumb reference when there is no trail, and drops empty values", () => {
    const nodes = pageJsonLd({ url: "/", name: "IconsDB" });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).not.toHaveProperty("breadcrumb");
    expect(nodes[0]).not.toHaveProperty("description");
  });
});

describe("iconJsonLd", () => {
  it("makes the image the page's subject rather than a second root", () => {
    const nodes = iconJsonLd(icon, set);
    const page = byType(nodes, "ItemPage");
    const image = byType(nodes, "ImageObject");
    expect(page["@id"]).toBe(`${SITE}/icon/lucide/house#page`);
    expect(page.mainEntity).toEqual({ "@id": `${SITE}/icon/lucide/house#icon` });
    expect(page.primaryImageOfPage).toEqual({ "@id": `${SITE}/icon/lucide/house#icon` });
    expect(image["@id"]).toBe(`${SITE}/icon/lucide/house#icon`);
    expect(image.license).toBe(set.license.url);
    expect(image.encodingFormat).toBe("image/svg+xml");
    expect(image.width).toBe(24);
    expect(byType(nodes, "BreadcrumbList").itemListElement).toHaveLength(4);
  });

  it("states a restricted set's terms as usageInfo, not as a licence", () => {
    const image = byType(iconJsonLd({ ...icon, prefix: "app-icons", name: "youtube", family: "youtube", raster: true }, appSet), "ImageObject");
    // Relative in the data, absolute in the graph — and never `license`: the
    // app icons grant the reader nothing.
    expect(image.usageInfo).toBe(`${SITE}/licenses#app-icons`);
    expect(image).not.toHaveProperty("license");
    expect(image.encodingFormat).toBe("image/png");
    expect(image.contentUrl).toMatch(/^https:\/\//);
    // Credited to the publisher we know, not to the set's placeholder author.
    expect(image.creditText).toBe("Google LLC");
    expect(image.copyrightNotice).toBe("Google LLC — trademark of its owner");
  });

  it("names the last crumb after the heading, not the slug", () => {
    const crumbs = byType(iconJsonLd({ ...icon, prefix: "app-icons", name: "youtube", family: "youtube", raster: true }, appSet), "BreadcrumbList");
    expect((crumbs.itemListElement as Node[]).at(-1)!.name).toBe("YouTube app icon");
  });
});

describe("collectionJsonLd", () => {
  it("lists the icons the page actually renders, while counting the whole set", () => {
    const [page] = collectionJsonLd(set, [{ name: "house" }, { name: "award" }]) as Node[];
    const list = page.mainEntity as Node;
    expect(page["@type"]).toBe("CollectionPage");
    expect(list.numberOfItems).toBe(1925);
    expect((list.itemListElement as Node[])[0]).toMatchObject({ url: `${SITE}/icon/lucide/house`, name: "House icon" });
  });

  it("keeps a paginated page on its own URL, with the set above it in the trail", () => {
    const nodes = collectionJsonLd(set, [{ name: "house" }], 3);
    const page = byType(nodes, "CollectionPage");
    expect(page.url).toBe(`${SITE}/library/lucide/page/3`);
    expect(page.name).toBe("Lucide icons — page 3");
    expect((byType(nodes, "BreadcrumbList").itemListElement as Node[]).map((i) => i.name)).toEqual(["IconsDB", "Library", "Lucide", "Page 3"]);
  });
});

describe("blogJsonLd", () => {
  const posts = [{ slug: "hello", title: "Hello", description: "d", date: "2026-01-01", author: "haxzie" }];

  it("gives the index the Blog id that post pages point at", () => {
    const [page] = blogJsonLd({ index: true, url: "/blog", name: "IconsDB Blog", description: "d", posts }) as Node[];
    expect(page["@id"]).toBe(`${SITE}/blog#blog`);
    expect(page.publisher).toEqual({ "@id": ORG_ID });
    expect((page.blogPost as Node[])[0].url).toBe(`${SITE}/blog/hello`);
  });

  it("nests a category listing inside that Blog", () => {
    const [page] = blogJsonLd({ url: "/blog/category/guides", name: "Guides", description: "d", posts }) as Node[];
    expect(page["@type"]).toBe("CollectionPage");
    expect((page.isPartOf as Node)["@id"]).toBe(`${SITE}/blog#blog`);
  });
});
