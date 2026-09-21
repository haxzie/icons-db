"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

let observer: IntersectionObserver | null = null;
const onVisible = new WeakMap<Element, () => void>();
function observe(el: Element, cb: () => void) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          onVisible.get(e.target)?.();
          observer!.unobserve(e.target);
        }
      },
      { rootMargin: "600px 0px" },
    );
  }
  onVisible.set(el, cb);
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/** Fetches the icon body (batched) only once the element is near the viewport, then renders it inline. */
export function IconGlyph({ prefix, name, className, eager }: { prefix: string; name: string; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(!!eager);
  useEffect(() => {
    if (near || !ref.current) return;
    return observe(ref.current, () => setNear(true));
  }, [near]);
  const icon = useIcon(prefix, name, near);
  if (icon === undefined) return <span ref={ref} className={`block animate-pulse rounded bg-bg-muted ${className ?? ""}`} />;
  if (icon === null) return <span className={`block rounded bg-bg-muted opacity-40 ${className ?? ""}`} />;
  return <InlineSvg icon={icon} className={className} />;
}
