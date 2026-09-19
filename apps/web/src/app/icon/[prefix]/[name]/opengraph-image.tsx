import { ImageResponse } from "next/og";
import { humanize, renderSVG, svgToDataUri, toIconifyIcon } from "@icons-db/core";
import { getCollection, getIcon } from "@/lib/db";

export const alt = "Icon preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default async function OgImage({ params }: { params: Promise<{ prefix: string; name: string }> }) {
  const { prefix, name } = await params;
  const [icon, collection] = await Promise.all([getIcon(prefix, name), getCollection(prefix)]);
  const svg = icon ? renderSVG(toIconifyIcon(icon), { width: 320, height: 320, color: collection?.palette ? undefined : "#202124" }) : "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #f5f7f8 0%, #ffffff 60%)",
          fontFamily: "sans-serif",
          color: "#202124",
          padding: 72,
        }}
      >
        <div
          style={{
            width: 420,
            height: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 48,
            background: "#fff",
            border: "2px solid #e0e3e7",
            boxShadow: "0 8px 40px rgba(26,115,232,.12)",
          }}
        >
          {svg ? <img src={svgToDataUri(svg)} width={320} height={320} alt="" /> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 72, flex: 1 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>{icon ? humanize(icon.family) : name}</div>
          <div style={{ fontSize: 32, color: "#5f6368", marginTop: 20 }}>{`${collection?.name ?? prefix}${icon?.style ? ` · ${icon.style}` : ""}`}</div>
          <div style={{ fontSize: 26, color: "#5f6368", marginTop: 12 }}>{collection ? `${collection.license.title} · free SVG, PNG & code` : ""}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: "auto", fontSize: 28, color: "#1a73e8", fontWeight: 600 }}>iconsdb.app</div>
        </div>
      </div>
    ),
    size,
  );
}
