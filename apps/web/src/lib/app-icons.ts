import appIconsJson from "../../public/data/app-icons.json";

/** Per-app metadata for the raster set — the publisher an icon belongs to and
 * the store listing it came from. Kept out of D1 because only the icon page
 * reads it, and it is small enough to ship with the bundle. */
export type AppMeta = {
  slug: string;
  name: string;
  publisher: string;
  genre: string;
  ratings: number;
  storeUrl: string;
};

export const appIcons = appIconsJson as AppMeta[];
export const appBySlug = new Map(appIcons.map((a) => [a.slug, a]));
