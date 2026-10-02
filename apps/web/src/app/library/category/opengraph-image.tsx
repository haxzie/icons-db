import { ImageResponse } from "next/og";
import { collections } from "@/lib/collections";
import { LIBRARY_CATEGORIES } from "@/lib/library-categories";
import { OgCard } from "@/lib/og-card";

export const alt = "Icon categories";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default function OgImage() {
  return new ImageResponse(OgCard({ title: "Icon categories", subtitle: `${LIBRARY_CATEGORIES.length} shelves across ${collections.length} open source sets` }), size);
}
