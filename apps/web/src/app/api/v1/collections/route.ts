import { getCollections } from "@/lib/db";
import { json } from "@/lib/api";

export async function GET() {
  const collections = await getCollections();
  return json({ total: collections.length, collections });
}
