// Animated icons are ordinary SVG bodies that carry SMIL animation elements
// (`<animate>`, `<set>`, `<animateTransform>`, `<animateMotion>`). They render
// and animate as-is wherever the body is inlined, so nothing here is needed to
// *show* them — this module exists for the two places animation cannot go:
//
//   - raster output (PNG), which is one frame, and
//   - CSS `mask`/`background-image`, where browsers do not run SVG animation.
//
// Both need a still that looks like the icon. Frame 0 is the obvious choice and
// the wrong one: the dominant idiom (line-md, svg-spinners) starts from a hidden
// state — `stroke-dashoffset` equal to the dash length — and animates *to* the
// drawn icon, so frame 0 is blank or half-drawn for 1,131 of the 1,287 animated
// icons in the index.
//
// So there are two stills, and which one you want depends on why you are asking:
//
//   freezeAnimations  the last frame, exactly as SMIL would leave it. Honest,
//                     and what `?static` on the SVG endpoint promises.
//   staticFrame       the most legible frame. Same walk, but per attribute it
//                     picks the value that draws the most ink, because the last
//                     frame of a "calendar-out" is a blank canvas — correct and
//                     useless as a thumbnail. This is what PNG and CSS masks get.

/** Animation elements, longest-first so `animate` never shadows `animateTransform`. */
const ANIMATION_TAGS = ["animateTransform", "animateMotion", "animate", "set"] as const;

const ANIMATION_TAG_RE = new RegExp(`^(?:${ANIMATION_TAGS.join("|")})$`);

/** Does this body animate? Covers SMIL plus icons that ship their own CSS keyframes. */
export function isAnimated(body: string): boolean {
  return /<(?:animate|animateTransform|animateMotion|set)[\s/>]/.test(body) || /@keyframes/.test(body);
}

const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/** Does this animation leave a trace once it ends? Without `fill="freeze"` the
 * attribute reverts to its base value, and an indefinite repeat never ends. */
function freezes(tag: string): boolean {
  return attr(tag, "fill") === "freeze" && attr(tag, "repeatCount") !== "indefinite";
}

/** The animation's resting state: the value it holds at the end of a cycle. */
function lastFrame(tag: string): string | undefined {
  const frames = keyframes(tag);
  return frames.length ? frames[frames.length - 1] : undefined;
}

/** Every value the animation passes through, in order. */
function keyframes(tag: string): string[] {
  const values = attr(tag, "values");
  if (values !== undefined) return values.split(";").map((v) => v.trim());
  const to = attr(tag, "to");
  const from = attr(tag, "from");
  if (to === undefined) return [];
  return from === undefined ? [to] : [from, to];
}

/** The value the parent attribute keeps once the animation has finished. */
function finalValue(tag: string): string | undefined {
  if (!freezes(tag)) return undefined;
  return lastFrame(tag);
}

/** How "draws the most ink" is decided for the attributes that control whether
 * an element is visible at all. Everything else has no visibility ordering
 * (a `d` path is not more or less visible than another) and falls back to the
 * final frame. */
const NEAREST_ZERO = new Set(["stroke-dashoffset"]);
const LARGEST = new Set(["opacity", "fill-opacity", "stroke-opacity", "stroke-width", "r", "width", "height", "scale"]);

/** The most legible value for `name`, chosen from the base value and every
 * keyframe. Ignores `fill="freeze"`: a looping spinner never freezes, but its
 * widest frame is still the one worth showing. */
function posterValue(tag: string, name: string, base: string | undefined): string | undefined {
  const frames = keyframes(tag);
  if (!frames.length) return undefined;
  const rank = NEAREST_ZERO.has(name) ? (n: number) => -Math.abs(n) : LARGEST.has(name) ? (n: number) => n : null;
  if (!rank) return finalValue(tag);
  let best = base;
  let bestRank = base !== undefined && !Number.isNaN(Number(base)) ? rank(Number(base)) : -Infinity;
  for (const f of frames) {
    const n = Number(f);
    if (Number.isNaN(n)) continue;
    if (rank(n) > bestRank) {
      bestRank = rank(n);
      best = f;
    }
  }
  return best === base ? undefined : best;
}

/** End point of a straight-line motion path (`M`/`L`/`H`/`V`, absolute or relative).
 * Curves and arcs return undefined — the motion is then dropped rather than guessed. */
function pathEnd(path: string): { x: number; y: number } | undefined {
  const tokens = path.match(/[a-zA-Z]|-?\d*\.?\d+/g);
  if (!tokens) return undefined;
  let x = 0;
  let y = 0;
  let cmd = "";
  let i = 0;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    if (!"MmLlHhVv".includes(cmd)) return undefined;
    const rel = cmd === cmd.toLowerCase();
    const n = () => Number(tokens[i++]);
    if (cmd === "H" || cmd === "h") {
      const v = n();
      x = rel ? x + v : v;
    } else if (cmd === "V" || cmd === "v") {
      const v = n();
      y = rel ? y + v : v;
    } else {
      const dx = n();
      const dy = n();
      if (Number.isNaN(dx) || Number.isNaN(dy)) return undefined;
      x = rel ? x + dx : dx;
      y = rel ? y + dy : dy;
      // A relative moveto starts a subpath but still moves the pen; L/l repeat
      // implicitly, and `M` repeats as `L`, which is the same maths.
    }
    if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
  }
  return { x, y };
}

/** Attribute writes to apply to one element's start tag. */
type Resolved = {
  /** attributeName -> resolved value, in document order (later animations win). */
  attrs: Map<string, string>;
  /** Resolved transforms in document order. `replace` (SMIL's default `additive`)
   * discards everything before it, including the element's own transform
   * attribute — which is how a spinner's `matrix(0 0 0 0 12 12)` placeholder is
   * meant to disappear. `sum` composes onto what is already there. */
  transforms: { fn: string; replace: boolean }[];
};

function setAttribute(tag: string, name: string, value: string): string {
  const existing = new RegExp(`(\\s${name}=")[^"]*(")`);
  if (existing.test(tag)) return tag.replace(existing, `$1${value}$2`);
  // Insert before the tag's own closing bracket, keeping `/>` intact.
  return tag.replace(/\s*\/?>$/, (end) => ` ${name}="${value}"${end.trimStart()}`);
}

function applyResolved(tag: string, f: Resolved): string {
  let out = tag;
  for (const [name, value] of f.attrs) {
    if (name === "transform") {
      // An `<animate attributeName="transform">` carries whole transform lists,
      // so it replaces rather than composes.
      out = setAttribute(out, "transform", value);
    } else {
      out = setAttribute(out, name, value);
    }
  }
  if (f.transforms.length) {
    const base = attr(out, "transform");
    let parts = base ? [base] : [];
    for (const t of f.transforms) {
      if (t.replace) parts = [t.fn];
      else parts.push(t.fn);
    }
    out = setAttribute(out, "transform", parts.join(" "));
  }
  return out;
}

/**
 * Strip every animation element and write the value each one would have left
 * behind onto its parent. `policy` decides which value that is — see the note at
 * the top of this file.
 *
 * Bodies that animate through CSS (`@keyframes` inside a `<style>`) are returned
 * unchanged — there is nothing to resolve without a style engine — so callers
 * that need a guaranteed-static body should check `isAnimated` on the result.
 */
function flatten(body: string, policy: "final" | "poster"): string {
  if (!isAnimated(body)) return body;

  // One pass over the tags, tracking open elements so each animation element
  // knows which start tag to write to.
  type Open = { start: number; end: number; resolved: Resolved };
  const open: Open[] = [];
  const edits: { start: number; end: number; text: string }[] = [];
  // Lazy attribute group so a trailing "/" lands in the self-closing capture.
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|[^>"])*?)(\/?)>/g;

  for (let m = tagRe.exec(body); m !== null; m = tagRe.exec(body)) {
    const [tag, closing, name, , selfClosing] = m;
    if (closing) {
      const el = open.pop();
      if (el && (el.resolved.attrs.size || el.resolved.transforms.length)) {
        edits.push({ start: el.start, end: el.end, text: applyResolved(body.slice(el.start, el.end), el.resolved) });
      }
      continue;
    }
    if (ANIMATION_TAG_RE.test(name)) {
      // The element goes either way; what it leaves behind depends on the policy.
      edits.push({ start: m.index, end: m.index + tag.length, text: "" });
      const parent = open[open.length - 1];
      if (!parent) continue;
      if (name === "animateMotion") {
        // Motion is always supplemental to the transform attribute.
        const path = attr(tag, "path");
        const end = path && freezes(tag) ? pathEnd(path) : undefined;
        if (end) parent.resolved.transforms.push({ fn: `translate(${end.x} ${end.y})`, replace: false });
      } else if (name === "animateTransform") {
        const type = attr(tag, "type") ?? "translate";
        // Poster mode applies the transform even when it loops, because a
        // replacing animateTransform overrides the element's base transform for
        // as long as it runs — that is what the icon actually looks like. A scale
        // has a visibility ordering (0 collapses the element); rotate and
        // translate do not, so they take their resting frame.
        const value =
          policy === "poster" ? (type === "scale" ? posterValue(tag, "scale", undefined) ?? lastFrame(tag) : lastFrame(tag)) : finalValue(tag);
        if (value !== undefined) parent.resolved.transforms.push({ fn: `${type}(${value})`, replace: attr(tag, "additive") !== "sum" });
      } else {
        const target = attr(tag, "attributeName");
        if (target) {
          // Later animations on one attribute build on what earlier ones chose.
          const base = parent.resolved.attrs.get(target) ?? attr(body.slice(parent.start, parent.end), target);
          const value = policy === "poster" ? posterValue(tag, target, base) : finalValue(tag);
          if (value !== undefined) parent.resolved.attrs.set(target, value);
        }
      }
      // `<animate></animate>` — skip the matching close tag by not pushing.
      if (!selfClosing) {
        const close = body.indexOf(`</${name}>`, m.index);
        if (close >= 0) {
          edits[edits.length - 1].end = close + name.length + 3;
          tagRe.lastIndex = edits[edits.length - 1].end;
        }
      }
      continue;
    }
    if (!selfClosing) open.push({ start: m.index, end: m.index + tag.length, resolved: { attrs: new Map(), transforms: [] } });
  }

  if (!edits.length) return body;
  edits.sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const e of edits) {
    out += body.slice(cursor, e.start) + e.text;
    cursor = e.end;
  }
  return out + body.slice(cursor);
}

/** The icon's last frame, exactly as SMIL would leave it. */
export function freezeAnimations(body: string): string {
  return flatten(body, "final");
}

/** The icon's most legible frame — what to rasterise or hand to a CSS mask. */
export function staticFrame(body: string): string {
  return flatten(body, "poster");
}
