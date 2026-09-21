import { ImageResponse } from "next/og";
import { renderSVG, svgToDataUri, toIconifyIcon } from "@icons-db/core";
import { collectionByPrefix } from "@/lib/collections";
import { getIcons, listCollectionPage } from "@/lib/db";

export const alt = "Icon set preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

export default async function OgImage({ params }: { params: Promise<{ prefix: string }> }) {
  const { prefix } = await params;
  const c = collectionByPrefix.get(prefix);
  if (!c) return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#fff" }} />, size);

  // Prefer the curated samples, then top up alphabetically to fill the grid.
  const want = 18;
  let icons = await getIcons(prefix, c.samples.slice(0, want));
  if (icons.length < want) {
    const { icons: more } = await listCollectionPage(prefix, 1, 60);
    const seen = new Set(icons.map((i) => i.name));
    for (const m of more) {
      if (icons.length >= want) break;
      if (!seen.has(m.name)) {
        icons.push({ ...m, id: `${prefix}:${m.name}`, family: m.name, style: "", category: null, aliases: [] });
        seen.add(m.name);
      }
    }
  }
  icons = icons.slice(0, want);
  const color = c.palette ? undefined : "#202124";
  const tiles = icons.map((i) => svgToDataUri(renderSVG(toIconifyIcon(i), { width: 56, height: 56, color })));
  const kind = c.kind === "emoji" ? "emoji" : c.kind === "brands" ? "logos" : "icons";
  const license = `${c.license.spdx ?? c.license.title}${c.license.attribution ? " · attribution required" : " · free for commercial use"}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f5f7f8 0%, #ffffff 60%)",
          fontFamily: "sans-serif",
          color: "#202124",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingRight: 48 }}>
          <div style={{ fontSize: 26, color: "#1a73e8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{kind}</div>
          <div style={{ fontSize: c.name.length > 18 ? 56 : 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, marginTop: 12 }}>{c.name}</div>
          <div style={{ fontSize: 32, color: "#5f6368", marginTop: 20 }}>{`${c.total.toLocaleString()} ${kind} · by ${c.author.name}`}</div>
          <div style={{ fontSize: 24, color: "#5f6368", marginTop: 10 }}>{license}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: "auto", fontSize: 28, color: "#1a73e8", fontWeight: 600 }}>iconsdb.app</div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 6 * 84 + 5 * 12,
            alignContent: "center",
            gap: 12,
          }}
        >
          {tiles.map((src, i) => (
            <div
              key={i}
              style={{
                width: 84,
                height: 84,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                background: "#fff",
                border: "2px solid #e0e3e7",
              }}
            >
              <img src={src} width={48} height={48} alt="" />
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
