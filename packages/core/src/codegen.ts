export type SnippetKind =
  | "svg"
  | "react"
  | "vue"
  | "svelte"
  | "iconify"
  | "unplugin"
  | "css"
  | "data-uri";

export type Snippet = { kind: SnippetKind; label: string; language: string; code: string; note?: string };

import { pascal } from "./packages";
import { isAnimated, staticFrame } from "./animation";
import { svgToDataUri } from "./svg";

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
