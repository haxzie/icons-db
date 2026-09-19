import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Cover";
export const size = { width: 1600, height: 900 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let svg = "";
  try {
    svg = await readFile(join(process.cwd(), "public", "blog", "covers", `${slug}.svg`), "utf8");
  } catch {}
  const src = svg ? `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff" }}>
        {src ? <img src={src} width={1600} height={900} alt="" /> : null}
      </div>
    ),
    size,
  );
}
