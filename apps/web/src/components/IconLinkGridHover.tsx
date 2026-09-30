"use client";

import { useRef } from "react";
import { replaySmil } from "./IconGlyph";

/**
 * Replays an animated icon when the pointer enters its tile.
 *
 * One delegated listener rather than a handler per tile: the tiles are server
 * components on purpose (real links, crawlable) and a grid holds hundreds of
 * them. `mouseover` fires for every element under the pointer, so the tile the
 * pointer is currently in is tracked and only a change of tile replays —
 * without that, replacing the icon's markup re-enters the new nodes and the
 * animation would restart in a loop for as long as you hovered.
 */
export function IconLinkGridHover({ className, children }: { className?: string; children: React.ReactNode }) {
  const active = useRef<Element | null>(null);
  return (
    <div
      className={className}
      onMouseOver={(e) => {
        const tile = (e.target as Element).closest("a");
        // Crossing the gap between tiles counts as leaving, so coming back to
        // the same one replays rather than sitting there doing nothing.
        if (!tile) {
          active.current = null;
          return;
        }
        if (tile === active.current) return;
        active.current = tile;
        replaySmil(tile.querySelector("svg"));
      }}
      onMouseLeave={() => {
        active.current = null;
      }}
    >
      {children}
    </div>
  );
}
