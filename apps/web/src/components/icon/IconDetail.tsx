"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSnippets,
  humanize,
  isAnimated,
  renderSVG,
  splitVariant,
  staticFrame,
  type CollectionMeta,
  type KeywordIndex,
  type SemanticHit,
} from "@icons-db/core";
import { useIcon } from "@/lib/icon-store";
import { downloadBlob, svgToPng, useCopy } from "@/lib/client-utils";
import { IconGlyph, InlineSvg } from "../IconGlyph";
import { LicenseBadge } from "../LicenseBadge";

type Props = {
  prefix: string;
  name: string;
  index: KeywordIndex | null;
  collection?: CollectionMeta;
  onClose?: () => void;
  onSelect: (prefix: string, name: string) => void;
  variant?: "panel" | "page";
  /** Pre-computed variants (server-rendered pages); otherwise derived from the client index. */
  variants?: { name: string; style: string }[];
};

const PREVIEW_SIZES = [16, 24, 32, 48, 96];
const PNG_SIZES = [64, 128, 256, 512, 1024];
const PRESET_COLORS = ["#000000", "#ffffff", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6"];

export function IconDetail({ prefix, name, index, collection, onClose, onSelect, variant = "panel", variants: givenVariants }: Props) {
  const icon = useIcon(prefix, name);
  const { copied, copy } = useCopy();
  const [color, setColor] = useState<string>("");
  const [previewSize, setPreviewSize] = useState(48);
  const [pngSize, setPngSize] = useState(256);
  const [tab, setTab] = useState("svg");
  const [similar, setSimilar] = useState<SemanticHit[]>([]);
  const previewRef = useRef<SVGSVGElement>(null);

  const suffixes = useMemo(
    () => index?.data.prefixes.find((p) => p.prefix === prefix)?.suffixes ?? collection?.suffixes ?? {},
    [index, prefix, collection],
  );
  const { family, style } = useMemo(() => splitVariant(name, suffixes), [name, suffixes]);

  const variants = useMemo(() => {
    if (givenVariants) return givenVariants;
    if (!index) return [];
    const pi = index.data.prefixes.findIndex((p) => p.prefix === prefix);
    const out: { name: string; style: string }[] = [];
    for (const e of index.data.icons) {
      if (e[0] !== pi || e.length === 5) continue;
      const v = splitVariant(e[1], suffixes);
      if (v.family === family) out.push({ name: e[1], style: v.style });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [index, prefix, family, suffixes, givenVariants]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/v1/search?q=${encodeURIComponent(humanize(family))}&mode=semantic&limit=120`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ icons: SemanticHit[] }>)
      .then((d) => {
        const seen = new Set<string>([`${prefix}/${family}`]);
        const out: SemanticHit[] = [];
        for (const h of d.icons) {
          const sfx = index?.data.prefixes.find((p) => p.prefix === h.prefix)?.suffixes ?? {};
          const key = `${h.prefix}/${splitVariant(h.name, sfx).family}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(h);
          if (out.length >= 24) break;
        }
        setSimilar(out);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [prefix, family, index]);

  const svg = useMemo(() => (icon ? renderSVG(icon, { width: "1em", height: "1em", color: color || undefined }) : ""), [icon, color]);
  const animated = useMemo(() => Boolean(icon) && isAnimated(svg), [icon, svg]);
  const snippets = useMemo(() => (icon ? buildSnippets({ prefix, name, svg }) : []), [icon, prefix, name, svg]);
  const active = snippets.find((s) => s.kind === tab) ?? snippets[0];

  /** line-md and friends play once on load, so the only way to see the animation
   * again is to rewind the document's SMIL clock. */
  function replay() {
    previewRef.current?.setCurrentTime(0);
  }

  async function downloadPng() {
    if (!icon) return;
    let px = renderSVG(icon, { width: pngSize, height: pngSize, color: color || (document.documentElement.classList.contains("dark") ? "#ffffff" : "#000000") });
    // A PNG is one frame, and frame 0 of most animated icons is blank.
    if (animated) px = staticFrame(px);
    const blob = await svgToPng(px, pngSize);
    downloadBlob(blob, `${prefix}-${name}-${pngSize}.png`);
  }

  const shell =
    variant === "panel"
      ? "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg-elevated md:static md:sticky md:top-24 md:z-0 md:h-[calc(100vh-7rem)] md:w-[400px] md:shrink-0 md:rounded-2xl md:border"
      : "";

  return (
    <aside className={`${shell} scrollbar-thin fade-in`}>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b bg-bg-elevated p-4 md:rounded-t-2xl">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-mono text-sm font-medium">{name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
            <Link href={`/library/${prefix}`} className="hover:text-fg">
              {collection?.name ?? prefix}
            </Link>
            <span>·</span>
            <span>{style}</span>
            {animated && (
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent" title="This icon animates on its own">
                Animated
              </span>
            )}
            {collection && <LicenseBadge license={collection.license} withLink />}
          </p>
        </div>
        {variant === "panel" && (
          <>
            <Link href={`/icon/${prefix}/${name}`} title="Open page" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-bg-muted hover:text-fg">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
            </Link>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-bg-muted hover:text-fg">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="p-4">
        <div className="relative flex items-center justify-center rounded-xl border bg-bg py-8" style={{ color: color || undefined }}>
          {icon ? (
            <InlineSvg icon={icon} svgRef={previewRef} style={{ width: previewSize, height: previewSize }} />
          ) : (
            <span className="size-12 animate-pulse rounded bg-bg-muted" />
          )}
          {animated && (
            <button
              type="button"
              onClick={replay}
              title="Replay animation"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-md border bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-fg-subtle">Size</span>
            <div className="ml-auto flex gap-1">
              {PREVIEW_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewSize(s)}
                  className={`rounded px-1.5 py-0.5 tabular-nums ${previewSize === s ? "bg-bg-muted text-fg" : "text-fg-subtle hover:text-fg"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-fg-subtle">Color</span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setColor("")}
                title="currentColor"
                aria-pressed={!color}
                className={`grid size-5 place-items-center rounded border ${color ? "hover:border-fg-subtle" : "border-accent ring-1 ring-accent"}`}
              >
                <span className="size-2.5 rounded-full bg-current" />
              </button>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={c}
                  aria-pressed={color === c}
                  style={{ background: c }}
                  className={`size-5 rounded border ${color === c ? "border-accent ring-1 ring-accent" : "border-line hover:border-fg-subtle"}`}
                />
              ))}
              <label
                title={color || "Custom color"}
                className="relative grid size-5 cursor-pointer place-items-center overflow-hidden rounded border border-line hover:border-fg-subtle"
                style={{ background: "conic-gradient(#ef4444,#eab308,#22c55e,#06b6d4,#6366f1,#ec4899,#ef4444)" }}
              >
                <input
                  type="color"
                  value={color || "#6366f1"}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Action onClick={() => copy(svg, "svg")} done={copied === "svg"} disabled={!icon}>
            Copy SVG
          </Action>
          <Action onClick={() => copy(`${prefix}:${name}`, "name")} done={copied === "name"}>
            Copy name
          </Action>
          <a
            href={`/api/v1/icon/${prefix}/${name}.svg?download${color ? `&color=${encodeURIComponent(color)}` : ""}`}
            className="flex h-9 items-center justify-center rounded-lg border bg-bg-elevated text-sm hover:border-fg-subtle"
          >
            Download SVG
          </a>
          <div className="flex h-9 overflow-hidden rounded-lg border bg-bg-elevated text-sm">
            <button type="button" onClick={downloadPng} disabled={!icon} className="flex-1 hover:bg-bg-muted">
              PNG
            </button>
            <select
              value={pngSize}
              onChange={(e) => setPngSize(Number(e.target.value))}
              className="border-l bg-transparent px-1 text-xs text-fg-muted outline-none"
            >
              {PNG_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </div>
        </div>

        {variants.length > 1 && (
          <Section title={`${variants.length} variants`}>
            <div className="flex flex-wrap gap-1">
              {variants.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  title={v.name}
                  onClick={() => onSelect(prefix, v.name)}
                  className={`icon-cell grid size-10 place-items-center rounded-lg border ${v.name === name ? "border-accent bg-accent/10" : "border-transparent hover:border-line hover:bg-bg"}`}
                >
                  <IconGlyph prefix={prefix} name={v.name} className="size-5" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {snippets.length > 0 && (
          <Section title="Code">
            <div className="scrollbar-thin -mx-1 flex gap-0.5 overflow-x-auto px-1 text-xs">
              {snippets.map((s) => (
                <button
                  key={s.kind}
                  type="button"
                  onClick={() => setTab(s.kind)}
                  className={`shrink-0 rounded-md px-2 py-1 ${active?.kind === s.kind ? "bg-bg-muted text-fg" : "text-fg-subtle hover:text-fg"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {active && (
              <div className="relative mt-2">
                <pre className="scrollbar-thin max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-bg p-3 pr-16 font-mono text-[11px] leading-relaxed text-fg-muted">
                  {active.code}
                </pre>
                <button
                  type="button"
                  onClick={() => copy(active.code, `code:${active.kind}`)}
                  className="absolute right-2 top-2 rounded-md border bg-bg-elevated px-2 py-0.5 text-xs hover:border-fg-subtle"
                >
                  {copied === `code:${active.kind}` ? "Copied" : "Copy"}
                </button>
                {active.note && <p className="mt-2 text-xs leading-relaxed text-fg-muted">{active.note}</p>}
              </div>
            )}
          </Section>
        )}

        {similar.length > 0 && (
          <Section title="Similar across sets">
            <div className="flex flex-wrap gap-1">
              {similar.map((s) => (
                <button
                  key={`${s.prefix}:${s.name}`}
                  type="button"
                  title={`${s.prefix}:${s.name}`}
                  onClick={() => onSelect(s.prefix, s.name)}
                  className="icon-cell grid size-10 place-items-center rounded-lg border border-transparent hover:border-line hover:bg-bg"
                >
                  <IconGlyph prefix={s.prefix} name={s.name} className="size-5" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {collection && (
          <Section title="License">
            <p className="text-xs leading-relaxed text-fg-muted">
              <span className="text-fg">{collection.name}</span> by{" "}
              {collection.author.url ? (
                <a href={collection.author.url} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                  {collection.author.name}
                </a>
              ) : (
                collection.author.name
              )}{" "}
              is licensed under{" "}
              {collection.license.url ? (
                <a href={collection.license.url} className="underline decoration-line hover:text-fg" target="_blank" rel="noreferrer">
                  {collection.license.title}
                </a>
              ) : (
                collection.license.title
              )}
              .{" "}
              {collection.license.attribution
                ? "Attribution to the author is required when you use these icons."
                : "Free for personal and commercial use; no attribution required."}{" "}
              <Link href="/licenses" className="underline decoration-line hover:text-fg">
                Details
              </Link>
              {collection.kind === "brands" && " Logos are trademarks of their owners; the license covers the SVG only."}
            </p>
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</h3>
      {children}
    </div>
  );
}

function Action({ onClick, done, disabled, children }: { onClick: () => void; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 rounded-lg border text-sm transition ${done ? "border-accent bg-accent/10 text-fg" : "bg-bg-elevated hover:border-fg-subtle"} disabled:opacity-50`}
    >
      {done ? "Copied" : children}
    </button>
  );
}
