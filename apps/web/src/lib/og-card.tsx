import { readFile } from "node:fs/promises";
import { join } from "node:path";

let logo: string | null = null;
async function logoDataUri() {
  if (!logo) {
    const svg = await readFile(join(process.cwd(), "public", "logo.svg"), "utf8");
    logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return logo;
}

/** The brand OG card: logo mark + one big line, white background. */
export async function OgCard({ title, subtitle }: { title: string; subtitle?: string }) {
  const src = await logoDataUri();
  const long = title.length > 28;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "sans-serif",
        color: "#202124",
        padding: "0 96px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <img src={src} width={132} height={132} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: long ? 64 : 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 860 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 32, color: "#5f6368", marginTop: 14 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
