import { iconToSVG, iconToHTML, replaceIDs } from "@iconify/utils";
import type { IconifyIcon } from "@iconify/types";
import type { IconRecord } from "./types";

export type RenderOptions = {
  color?: string;
  width?: number | string;
  height?: number | string;
};

export function toIconifyIcon(icon: Pick<IconRecord, "body" | "width" | "height" | "left" | "top" | "rotate" | "hFlip" | "vFlip">): IconifyIcon {
  return {
    body: icon.body,
    width: icon.width,
    height: icon.height,
    left: icon.left,
    top: icon.top,
    rotate: icon.rotate,
    hFlip: icon.hFlip,
    vFlip: icon.vFlip,
  };
}

/** Full standalone <svg> markup. Colour defaults to currentColor. */
export function renderSVG(icon: IconifyIcon, opts: RenderOptions = {}): string {
  const w = icon.width ?? 16;
  const h = icon.height ?? 16;
  let width: number | string = opts.width ?? "1em";
  let height: number | string = opts.height ?? "1em";
  if (opts.width !== undefined && opts.height === undefined) height = scale(opts.width, h / w);
  else if (opts.height !== undefined && opts.width === undefined) width = scale(opts.height, w / h);
  const rendered = iconToSVG(icon, { width, height });
  let body = replaceIDs(rendered.body);
  if (opts.color) body = body.replace(/currentColor/g, opts.color);
  return iconToHTML(body, rendered.attributes);
}

function scale(value: number | string, ratio: number): number | string {
  const m = /^(\d+(?:\.\d+)?)([a-z%]*)$/.exec(String(value));
  if (!m) return value;
  const n = Math.round(Number(m[1]) * ratio * 1000) / 1000;
  return m[2] ? `${n}${m[2]}` : n;
}

/** viewBox + body for inline rendering inside React. */
export function renderInline(icon: IconifyIcon): { viewBox: string; body: string } {
  const rendered = iconToSVG(icon, { width: "1em", height: "1em" });
  return { viewBox: rendered.attributes.viewBox, body: replaceIDs(rendered.body) };
}

export function svgToDataUri(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
}
