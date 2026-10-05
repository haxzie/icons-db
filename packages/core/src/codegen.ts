export type SnippetKind =
  | "svg"
  | "react"
  | "vue"
  | "svelte"
  | "iconify"
  | "unplugin"
  | "css"
  | "data-uri"
  | "html"
  | "url"
  | "markdown";

export type Snippet = { kind: SnippetKind; label: string; language: string; code: string; note?: string };

import { pascal } from "./packages";
import { isAnimated, staticFrame } from "./animation";
import { svgToDataUri } from "./svg";
import { DEFAULT_RASTER_SIZE, DEFAULT_RASTER_VARIANT, rasterUrl, type RasterSize, type RasterVariant } from "./raster";

const MASK_NOTE =
  "This icon is animated. Browsers do not run SVG animation inside a CSS mask, so the rule above uses a still of the drawn icon. Inline the SVG (or use the React/Vue/Svelte snippet) to keep the animation.";
const DATA_URI_NOTE =
  "This icon is animated and the data URI keeps the animation, which plays in an <img>. It will not animate as a CSS mask — see the CSS snippet for a still version.";

function toJsxAttrs(svg: string): string {
  return svg
    .replace(/\b([a-z]+)-([a-z])/g, (m, a: string, b: string) =>
      m.startsWith("data-") || m.startsWith("aria-") ? m : `${a}${b.toUpperCase()}`,
    )
    .replace(/class=/g, "className=")
    .replace(/xlink:href/g, "xlinkHref")
    .replace(/xmlns:xlink/g, "xmlnsXlink");
}

export function buildSnippets(opts: { prefix: string; name: string; svg: string }): Snippet[] {
  const { prefix, name, svg } = opts;
  const animated = isAnimated(svg);
  const dataUri = svgToDataUri(svg);
  // CSS masks ignore SMIL, and frame 0 of most animated icons is blank or
  // half-drawn, so the mask gets a still instead of the live body.
  const maskUri = animated ? svgToDataUri(staticFrame(svg)) : dataUri;
  const id = `${prefix}:${name}`;
  const component = pascal(`${prefix}-${name}`);
  const jsx = toJsxAttrs(svg).replace("<svg ", "<svg {...props} ");
  return [
    { kind: "svg", label: "SVG", language: "html", code: svg },
    {
      kind: "react",
      label: "React",
      language: "tsx",
      code: `import type { SVGProps } from "react";\n\nexport function ${component}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${jsx}\n  );\n}\n`,
    },
    {
      kind: "vue",
      label: "Vue",
      language: "vue",
      code: `<template>\n  ${svg}\n</template>\n`,
    },
    {
      kind: "svelte",
      label: "Svelte",
      language: "svelte",
      code: `${svg.replace("<svg ", "<svg {...$$props} ")}\n`,
    },
    {
      kind: "iconify",
      label: "Iconify",
      language: "html",
      code: `<script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>\n<iconify-icon icon="${id}"></iconify-icon>`,
    },
    {
      kind: "unplugin",
      label: "unplugin-icons",
      language: "ts",
      code: `import ${component} from "~icons/${prefix}/${name}";`,
    },
    {
      kind: "css",
      label: "CSS",
      language: "css",
      code: `.icon-${name} {\n  width: 24px;\n  height: 24px;\n  background-color: currentColor;\n  -webkit-mask: url("${maskUri}") no-repeat center / contain;\n  mask: url("${maskUri}") no-repeat center / contain;\n}`,
      note: animated ? MASK_NOTE : undefined,
    },
    { kind: "data-uri", label: "Data URI", language: "text", code: dataUri, note: animated ? DATA_URI_NOTE : undefined },
  ];
}

/**
 * Snippets for a raster (PNG) icon.
 *
 * Deliberately not the SVG list with the impossible entries removed: nothing
 * here can be recoloured or masked, so a component wrapping inline markup has
 * nothing to wrap. What people actually want from a PNG is a URL, so every
 * snippet is a different way of spelling one.
 */
export function buildRasterSnippets(opts: {
  prefix: string;
  name: string;
  label: string;
  origin: string;
  size?: RasterSize;
  variant?: RasterVariant;
}): Snippet[] {
  const { prefix, name, label, origin } = opts;
  const size = opts.size ?? DEFAULT_RASTER_SIZE;
  const variant = opts.variant ?? DEFAULT_RASTER_VARIANT;
  const url = origin + rasterUrl(prefix, name, { size, variant });
  const alt = `${label} icon`;
  const display = Math.min(size, 64);
  return [
    {
      kind: "html",
      label: "HTML",
      language: "html",
      code: `<img src="${url}" alt="${alt}" width="${display}" height="${display}" />`,
    },
    {
      kind: "react",
      label: "React",
      language: "tsx",
      code: `<img src="${url}" alt="${alt}" width={${display}} height={${display}} />`,
    },
    {
      kind: "css",
      label: "CSS",
      language: "css",
      code: `.icon-${name} {\n  width: ${display}px;\n  height: ${display}px;\n  background: url("${url}") no-repeat center / contain;\n}`,
      note: "A PNG cannot be used as a CSS mask the way the SVG sets can — it carries its own colour, so it goes in `background` instead.",
    },
    { kind: "markdown", label: "Markdown", language: "markdown", code: `![${alt}](${url})` },
    { kind: "url", label: "URL", language: "text", code: url },
  ];
}
