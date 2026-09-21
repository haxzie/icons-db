import { ImageResponse } from "next/og";
import { collectionByPrefix } from "@/lib/collections";
import { OgCard } from "@/lib/og-card";

export const alt = "Icon set";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default async function OgImage({ params }: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await params;
  const c = collectionByPrefix.get(prefix);
  const kind = c?.kind === "emoji" ? "emoji" : c?.kind === "brands" ? "logos" : "icons";
  return new ImageResponse(
    OgCard({ title: c?.name ?? prefix, subtitle: c ? `${c.total.toLocaleString()} free ${kind} · ${c.license.spdx ?? c.license.title}` : undefined }),
    size,
  );
}
