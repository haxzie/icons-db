import conceptsJson from "../../public/data/concepts.json";
import { humanize } from "@icons-db/core";

export type Concept = { slug: string; sets: number; icons: number };

export const concepts = conceptsJson as Concept[];
export const conceptBySlug = new Map(concepts.map((c) => [c.slug, c]));

export function conceptName(slug: string): string {
  return humanize(slug);
}

export function conceptTitle(slug: string): string {
  const n = conceptName(slug);
  return n[0].toUpperCase() + n.slice(1);
}
