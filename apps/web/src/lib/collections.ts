import type { CollectionMeta } from "@icons-db/core";
import collectionsJson from "../../public/data/collections.json";

export const collections = collectionsJson as unknown as CollectionMeta[];
export const collectionByPrefix = new Map(collections.map((c) => [c.prefix, c]));
