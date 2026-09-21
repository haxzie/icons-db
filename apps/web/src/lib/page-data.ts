import { unstable_cache } from "next/cache";
import { getFamilyAcrossSets, getIcon, getRelatedInSet, getSameFamilyAcrossSets, getVariants, listCollectionPage, type FamilyInSet, type IconLink } from "./db";
import type { IconRecord } from "@icons-db/core";

const WEEK = 604800;
const DAY = 86400;

/** Everything the /icon/[prefix]/[name] page needs, cached as one KV entry. */
export const getIconPageData = (prefix: string, name: string) =>
  unstable_cache(
    async () => {
      const icon = await getIcon(prefix, name);
      if (!icon) return null;
      const [variants, acrossSets, related] = await Promise.all([
        getVariants(prefix, icon.family),
        getSameFamilyAcrossSets(prefix, icon.family),
        getRelatedInSet(prefix, icon.family, icon.category),
      ]);
      return { icon, variants, acrossSets, related } as {
        icon: IconRecord;
        variants: IconRecord[];
        acrossSets: IconLink[];
        related: IconLink[];
      };
    },
    ["icon-page", prefix, name],
    { revalidate: WEEK, tags: [`icon:${prefix}:${name}`, `set:${prefix}`] },
  )();

/** First page of a collection, cached. */
export const getCollectionFirstPage = (prefix: string, perPage: number) =>
  unstable_cache(
    () => listCollectionPage(prefix, 1, perPage),
    ["collection-page-1", prefix, String(perPage)],
    { revalidate: DAY, tags: [`set:${prefix}`] },
  )();

/** A concept's icons across sets, cached. */
export const getConceptData = (concept: string) =>
  unstable_cache(
    (): Promise<FamilyInSet[]> => getFamilyAcrossSets(concept),
    ["concept", concept],
    { revalidate: WEEK, tags: [`concept:${concept}`] },
  )();
