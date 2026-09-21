import { ImageResponse } from "next/og";
import { humanize } from "@icons-db/core";
import { collectionByPrefix } from "@/lib/collections";
import { getIcon } from "@/lib/db";
import { OgCard } from "@/lib/og-card";

export const alt = "Icon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default async function OgImage({ params }: { params: Promise<{ prefix: string; name: string }> }) {
  const { prefix, name } = await params;
  const [icon, c] = [await getIcon(prefix, name), collectionByPrefix.get(prefix)];
  const noun = c?.kind === "emoji" ? "emoji" : c?.kind === "brands" ? "logo" : "icon";
  const title = icon ? `${humanize(icon.family)} ${noun}` : name;
  return new ImageResponse(await OgCard({ title: title[0].toUpperCase() + title.slice(1), subtitle: c ? `${c.name} · ${c.license.spdx ?? c.license.title}` : undefined }), size);
}
