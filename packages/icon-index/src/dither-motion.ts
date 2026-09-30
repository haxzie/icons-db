// Keeps Dither Icons' hover animation alive inside an Iconify body.
//
// Upstream animates with a stylesheet that targets runtime hooks: a `.di-icon`
// root carrying `data-icon`/`data-animate`/`data-crafted`, and `data-part`
// markers on the groups that move. Two things stand in the way of shipping that
// as an icon body:
//
//   1. The `.di-icon` root is the <svg> element, which a body does not own —
//      the site renders that. So the hooks move onto a wrapping <g>.
//   2. `cleanupSVG` strips `data-*` attributes (they are not SVG), though it
//      keeps `class`. So every hook becomes a class, and the selectors are
//      rewritten to match.
//
// The state flags are constants for us — we always render with `animate=true`,
// never `active`, and every icon upstream is `crafted` — so those conditions are
// resolved here rather than carried into the body, which also throws away the
// generic motion rules that only apply to non-crafted icons.

/** Class prefixes for the hooks that used to be data attributes. */
export const ICON_CLASS = "di-icon";
export const iconClass = (name: string): string => `di-i-${name}`;
export const partClass = (part: string): string => `di-p-${part}`;

/** `data-part="shell"` -> `class="di-part di-p-shell"`, plus the hooks we drop. */
export function rewriteMarkup(markup: string): string {
  return markup
    .replace(/\sdata-part="([^"]*)"/g, (_m, part: string) => ` class="di-part ${partClass(part)}"`)
    .replace(/\s(?:class|data-[\w-]+|aria-[\w-]+|role)="[^"]*"/g, (m) => (m.includes('class="di-part') ? m : ""));
}

type Block = { at: string | null; prelude: string; body: string };

/** Split a stylesheet into top-level blocks, tracking brace depth so a nested
 * at-rule body (`@media{…{…}}`) stays with its own block. */
function blocks(css: string): Block[] {
  const out: Block[] = [];
  let depth = 0;
  let start = 0;
  let open = -1;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) open = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const prelude = css.slice(start, open).trim();
        const body = css.slice(open + 1, i);
        const at = prelude.startsWith("@") ? prelude.split(/[\s({]/)[0] : null;
        if (prelude) out.push({ at, prelude, body });
        start = i + 1;
      }
    }
  }
  return out;
}

/**
 * Rewrite one selector onto the class hooks, or return null when it cannot
 * apply to us: a `.di-trigger` ancestor we have no way to reproduce, a rule for
 * a different icon, the `active` state we never set, or the generic motion
 * rules that exclude crafted icons (which is all of them).
 */
function rewriteSelector(selector: string, name: string): string | null {
  const s = selector.trim();
  if (!s) return null;
  if (s.includes(".di-trigger")) return null;
  if (s.includes("[data-crafted=true])")) return null;
  if (s.includes("[data-active=true]")) return null;
  const icon = /\[data-icon=["']?([\w-]+)["']?\]/.exec(s);
  if (icon && icon[1] !== name) return null;
  return s
    .replace(/\[data-icon=["']?[\w-]+["']?\]/g, `.${iconClass(name)}`)
    .replace(/\[data-part=["']?([\w-]+)["']?\]/g, (_m, part: string) => `.${partClass(part)}`)
    .replace(/\[data-part\]/g, ".di-part")
    .replace(/\[data-animate=true\]/g, "")
    .replace(/:not\(\[data-motion-runtime=true\]\)/g, "")
    .trim();
}

/** Split a selector list on its top-level commas; `:is(:hover,:focus-visible)`
 * carries commas of its own that must stay inside the selector. */
function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  out.push(list.slice(start));
  return out;
}

function rewriteRule(prelude: string, name: string): string | null {
  const kept = splitSelectors(prelude)
    .map((sel) => rewriteSelector(sel, name))
    .filter((sel): sel is string => sel !== null);
  return kept.length ? kept.join(",") : null;
}

const ANIMATION_NAME = /animation(?:-name)?\s*:\s*([^;}]+)/g;

/** Keyframe names a set of declarations actually calls for. */
function referenced(css: string): Set<string> {
  const names = new Set<string>();
  for (const [, value] of css.matchAll(ANIMATION_NAME)) {
    for (const token of value.split(/[\s,]+/)) {
      if (/^[a-zA-Z_][\w-]*$/.test(token) && !/^(none|infinite|normal|reverse|alternate|both|forwards|backwards|linear|ease|ease-in|ease-out|ease-in-out|running|paused|step-start|step-end)$/.test(token)) {
        names.add(token);
      }
    }
  }
  return names;
}

/**
 * The subset of the stylesheet that drives one icon, with every hook rewritten
 * to a class. Returns "" when nothing survives, which means the icon has no
 * animation we can carry.
 */
export function scopeStylesheet(css: string, name: string): string {
  const rules: string[] = [];
  const keyframes = new Map<string, string>();
  const wanted = new Set<string>();

  for (const block of blocks(css)) {
    if (block.at === "@keyframes") {
      keyframes.set(block.prelude.slice("@keyframes".length).trim(), `${block.prelude}{${block.body}}`);
      continue;
    }
    if (block.at) {
      // A grouping at-rule (only `@media(prefers-reduced-motion)` in practice):
      // rewrite what is inside it and keep the wrapper if anything survives.
      const inner = scopeStylesheet(block.body, name);
      if (inner) rules.push(`${block.prelude}{${inner}}`);
      continue;
    }
    const selector = rewriteRule(block.prelude, name);
    if (!selector) continue;
    rules.push(`${selector}{${block.body}}`);
    for (const ref of referenced(block.body)) wanted.add(ref);
  }

  const used = [...wanted].map((n) => keyframes.get(n)).filter((k): k is string => k !== undefined);
  return [...rules, ...used].join("");
}
