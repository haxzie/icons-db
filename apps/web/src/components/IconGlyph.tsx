"use client";

import { useMemo } from "react";
import type { IconifyIcon } from "@iconify/types";
import { renderInline } from "@icons-db/core";
import { useIcon } from "@/lib/icon-store";

/** SMIL only. Dither's icons animate through CSS, which already re-runs on
 * hover by itself and must not be restarted from here. */
const SMIL = /<(?:animate|animateTransform|animateMotion|set)[\s/>]/;

/**
 * Replay an icon's animation from the top.
 *
 * Re-inserting the markup is what does it: a SMIL element begins its clock when
 * it enters the document, so fresh nodes replay the whole choreography with each
 * `begin` offset intact. Seeking the fragment's clock with `setCurrentTime(0)`
 * reads like the tidier option, but it depends on inline SVG roots owning a
 * seekable time container, which is not something to bet an interaction on.
 */
export function replaySmil(svg: SVGSVGElement | null): void {
  if (svg && SMIL.test(svg.innerHTML)) svg.innerHTML = svg.innerHTML;
}

export function InlineSvg({
  icon,
  className,
  style,
  svgRef,
}: {
  icon: IconifyIcon;
  className?: string;
  style?: React.CSSProperties;
  /** For animated icons: lets the caller replay the animation via `replaySmil`. */
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  const { viewBox, body } = useMemo(() => renderInline(icon), [icon]);
  // Most animated icons play once on load and freeze, so by the time anyone
  // looks at one it is already over — hovering plays it again.
  const replay = useMemo(
    () => (SMIL.test(body) ? (e: React.MouseEvent<SVGSVGElement>) => replaySmil(e.currentTarget) : undefined),
    [body],
  );
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className}
      style={style}
      aria-hidden="true"
      onMouseEnter={replay}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Lazily fetches the icon body through the cross-set batched store and renders it inline. */
export function IconGlyph({ prefix, name, className }: { prefix: string; name: string; className?: string }) {
  const icon = useIcon(prefix, name);
  if (icon === undefined) return <span className={`block animate-pulse rounded bg-bg-muted ${className ?? ""}`} />;
  if (icon === null) return <span className={`block rounded bg-bg-muted opacity-40 ${className ?? ""}`} />;
  return <InlineSvg icon={icon} className={className} />;
}
