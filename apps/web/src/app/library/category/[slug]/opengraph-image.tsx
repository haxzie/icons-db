import { ImageResponse } from "next/og";
import { staticFrame } from "@icons-db/core";
import { getIconsByIds } from "@/lib/db";
import { CATEGORY_ART } from "@/lib/category-art";
import { categoryBySlug, categorySets } from "@/lib/library-categories";

export const alt = "Icon category";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800;

const COLS = 7;
const ROWS = 4;
const CELL = 182;
const TILE = 148;

/**
 * The share preview for a shelf, built to match its page banner: the same
 * gradient out of `CATEGORY_ART`, the same icons, the same scrim under the
 * title. The banner inlines the committed cover SVG, which is far too large to
 * ship into a Worker, so this redraws the composition from the icon bodies in
 * D1 instead — hence the coarser grid.
 *
 * Satori is not a browser, and two of its gaps bite here. An element with more
 * than one child must say `display: flex` or the whole render throws, which is
 * why the subtitle is assembled into one string first. And the `inset`
 * shorthand is silently ignored, so full-bleed overlays need their box spelled
 * out or they collapse to nothing.
 */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  const art = CATEGORY_ART[slug];
  if (!category || !art) return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#131314" }} />, size);

  const sets = categorySets(category);
  const icons = sets.reduce((n, s) => n + s.total, 0);
  // "multicolor" matches on palette, which the app icons also satisfy, so a
  // category can now hold a set that is neither open source nor free. Claim it
  // only when every set in the category earns it.
  const allOpen = sets.every((s) => !s.raster);
  // One string, not an interpolated run: satori throws on any element with more
  // than one child unless it is explicitly `display: flex`.
  const subtitle = `${sets.length} ${allOpen ? "open source " : ""}${sets.length === 1 ? "set" : "sets"} · ${icons.toLocaleString()} ${allOpen ? "free " : ""}icons · IconsDB`;

  // One pass over the pool, cycled to fill the grid. Whatever D1 does not have
  // (an alias with no row of its own) just leaves an empty tile.
  const wanted = Array.from({ length: COLS * ROWS }, (_, i) => art.pool[i % art.pool.length]);
  const records = await getIconsByIds([...new Set(wanted)]).catch(() => []);
  const byId = new Map(records.map((r) => [r.id, r]));

  const overlay = { display: "flex", position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%" };

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundImage: `linear-gradient(135deg, ${art.from}, ${art.to})`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ ...overlay, backgroundImage: `radial-gradient(circle at 26% 18%, ${art.glow}88, transparent 60%)` }} />
        {wanted.map((id, i) => {
          const record = byId.get(id);
          // Brick-offset alternate rows, so the grid does not read as columns.
          const row = Math.floor(i / COLS);
          return (
            <div
              key={`${id}-${i}`}
              style={{
                display: "flex",
                position: "absolute",
                left: (i % COLS) * CELL - (row % 2 ? CELL / 2 : 0) - 40,
                top: row * CELL - 30,
                width: TILE,
                height: TILE,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 38,
                background: art.tile,
                border: `1px solid ${art.stroke}`,
              }}
            >
              {record && !record.raster && <img src={toDataUri(record.body, record.width, record.height, art.ink, record.animated)} width={82} height={82} alt="" />}
            </div>
          );
        })}
        <div style={{ ...overlay, backgroundImage: `linear-gradient(to top, ${art.to} 8%, ${art.to}cc 38%, transparent 85%)` }} />
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 72, bottom: 62, width: 1056 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, color: "#ffffff" }}>{category.title}</div>
          <div style={{ fontSize: 31, color: "#ffffffcc", marginTop: 16 }}>{subtitle}</div>
        </div>
      </div>
    ),
    size,
  );
}

/** An icon body as a standalone SVG data URI, which is the only way satori will
 * draw it. `color` carries through to the `currentColor` most bodies use;
 * multicolour sets bring their own fills and ignore it. */
function toDataUri(body: string, w: number, h: number, ink: string, animated: boolean): string {
  // A share image is one frame, and most animated icons draw themselves in from
  // nothing — without this the animated shelf's preview is a near-empty box.
  const drawn = animated ? staticFrame(body) : body;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" color="${ink}">${drawn}</svg>`;
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}
