import { ImageResponse } from "next/og";
import { conceptBySlug, conceptTitle } from "@/lib/concepts";
import { OgCard } from "@/lib/og-card";

export const alt = "Icons";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default async function OgImage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  const c = conceptBySlug.get(concept);
  return new ImageResponse(OgCard({ title: `${conceptTitle(concept)} icons`, subtitle: c ? `${c.icons} free icons · ${c.sets} open source sets` : undefined }), size);
}
