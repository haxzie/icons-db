"use client";

import { useMemo } from "react";
import type { IconifyIcon } from "@iconify/types";
import { renderInline } from "@icons-db/core";
import { useIcon } from "@/lib/icon-store";

export function InlineSvg({ icon, className, style }: { icon: IconifyIcon; className?: string; style?: React.CSSProperties }) {
  const { viewBox, body } = useMemo(() => renderInline(icon), [icon]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className}
      style={style}
      aria-hidden="true"
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
