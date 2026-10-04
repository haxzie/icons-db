import type { CollectionMeta } from "@icons-db/core";
import { collections } from "./collections";

/**
 * Curated shelves for the library's storefront.
 *
 * The library is a flat list of 90 sets, which is the right shape once you know
 * what you are after and useless when you don't. These are the entry points for
 * the second case: a handful of groupings broad enough to be worth a card and
 * narrow enough that every set under one belongs there.
 *
 * `match` is deliberately a predicate rather than a stored field — nothing in
 * the icon pipeline knows about shelves, so a new set joins one by matching it,
 * not by someone remembering to tag it. Where a shelf is genuinely editorial
 * ("essentials") the predicate is an explicit prefix list, which is honest about
 * it being a judgement call. Sets can appear on more than one shelf; crypto
 * tokens are both logos and finance, and splitting that hair helps nobody.
 */
export type LibraryCategory = {
  slug: string;
  title: string;
  /** One line, on the card. */
  tagline: string;
  /** A paragraph, on the category page and in its meta description. */
  blurb: string;
  match: (c: CollectionMeta) => boolean;
};

const byPrefix = (...prefixes: string[]) => {
  const set = new Set(prefixes);
  return (c: CollectionMeta) => set.has(c.prefix);
};

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    slug: "essentials",
    title: "UI essentials",
    tagline: "The general-purpose sets most interfaces are built from",
    blurb:
      "Clean, consistent, general-purpose icon sets that cover the whole surface of an app — navigation, actions, status, settings. Pick one, use it everywhere. These are the sets to reach for first if you have no particular constraint.",
    match: byPrefix(
      "lucide", "heroicons", "tabler", "ph", "feather", "iconoir", "radix-icons", "mingcute", "solar", "carbon",
      "bi", "ion", "fluent", "hugeicons", "akar-icons", "gg", "majesticons", "humbleicons", "mynaui", "flowbite",
      "ri", "teenyicons", "jam", "mage", "prime", "tdesign", "ant-design", "ep", "keyline-icons", "reicon",
    ),
  },
  {
    slug: "brand-logos",
    title: "Brand logos",
    tagline: "Company, product and social marks",
    blurb:
      "Logos for the companies, products and services you integrate with or link to — social buttons, auth providers, payment badges, tech stack lists. Logos stay the property of their owners, so check each brand's own guidelines before shipping.",
    match: byPrefix("logos", "simple-icons", "fa6-brands", "fa7-brands", "bxl", "cib", "lobehub"),
  },
  {
    slug: "animated",
    title: "Animated icons",
    tagline: "SVGs that move on their own, no JavaScript",
    blurb:
      "Icons that animate themselves. The motion lives inside the SVG as SMIL or CSS, so it plays wherever the markup is inlined — no runtime, no player, no JavaScript. Good for loading states, toggles, confirmations and anything that benefits from a beat of feedback.",
    match: (c) => c.animated > 0,
  },
  {
    slug: "emoji",
    title: "Emoji",
    tagline: "Full Unicode emoji sets, flat and 3D",
    blurb:
      "Complete open source emoji sets you can self-host instead of leaning on whatever the user's platform ships. Flat, outlined, high-contrast and dimensional styles, all covering the Unicode catalogue.",
    match: (c) => c.kind === "emoji",
  },
  {
    slug: "developer",
    title: "Developer & file types",
    tagline: "Languages, frameworks, editors and file icons",
    blurb:
      "Icons for the things developers look at all day: programming languages, frameworks, build tools, editors, and the file-type glyphs that go in trees and tabs. Useful for docs, dashboards, CI output and anything with a file browser in it.",
    match: byPrefix("devicon", "skill-icons", "vscode-icons", "material-icon-theme", "catppuccin", "codicon", "octicon"),
  },
  {
    slug: "multicolor",
    title: "Multicolor",
    tagline: "Sets that ship their own palette",
    blurb:
      "Icons that carry their own colours rather than inheriting your text colour. They do not recolour with your theme, which is the point — they are illustrations at icon size, for empty states, onboarding, feature grids and marketing pages.",
    match: (c) => c.palette && c.kind !== "emoji",
  },
  {
    slug: "crypto-finance",
    title: "Crypto & finance",
    tagline: "Coins, tokens and money symbols",
    blurb:
      "Cryptocurrency and token marks for wallets, exchanges, portfolio trackers and price tables, covering thousands of assets beyond the handful every general set includes.",
    match: byPrefix("token", "token-branded"),
  },
  {
    slug: "flags",
    title: "Flags",
    tagline: "Every country, in three shapes",
    blurb:
      "National and regional flags as clean SVGs — rectangular, circular and rounded — for language pickers, country selects, shipping forms and dashboards that break numbers down by market.",
    match: byPrefix("flag", "circle-flags", "flagpack"),
  },
  {
    slug: "material",
    title: "Material Design",
    tagline: "Google's icon language, in every weight",
    blurb:
      "Google's icon language in its various generations and weights — the system set shipped with Android and used across Google's own products, plus the long-running community extension of it.",
    match: byPrefix("material-symbols", "material-symbols-light", "mdi", "ic", "line-md"),
  },
  {
    slug: "pixel",
    title: "Pixel & retro",
    tagline: "Low-res grids and dithered edges",
    blurb:
      "Icons drawn on a coarse grid, with hard pixel edges and dithered shading. For game UI, terminal tools, zines, and anything that wants to look like it came off a CRT.",
    match: byPrefix("pixelarticons", "dither"),
  },
];

export const categoryBySlug = new Map(LIBRARY_CATEGORIES.map((c) => [c.slug, c]));

/** The sets on a shelf, biggest first — the big sets are the reason to click. */
export function categorySets(category: LibraryCategory): CollectionMeta[] {
  return collections.filter(category.match).sort((a, b) => b.total - a.total);
}

export function categoryCoverUrl(slug: string): string {
  return `/library/categories/${slug}.svg`;
}
