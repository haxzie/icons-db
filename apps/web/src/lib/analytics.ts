"use client";

import posthog from "posthog-js";

/** Where an action happened, so the same event can be compared across surfaces. */
export type Surface = "search_panel" | "icon_page";

/**
 * The full event vocabulary. Keeping it in one closed map is what stops the
 * usual analytics rot — a typo'd event name becomes a type error instead of a
 * second, silently-empty funnel step in PostHog.
 */
type Events = {
  /** An icon reached the clipboard. `format` is the snippet kind: svg, name, react, vue, … */
  icon_copied: { set: string; icon: string; format: string; surface: Surface; recolored: boolean };
  /** An icon left as a file. `size` is px, PNG only. */
  icon_downloaded: { set: string; icon: string; format: "svg" | "png"; size?: number; surface: Surface; recolored: boolean };
  /** The detail view for an icon opened. */
  icon_viewed: { set: string; icon: string; surface: Surface };
  /**
   * One settled search. `semantic_ready` is false when the embedding model was
   * still loading at report time, so `results` is keyword-only — filter on it
   * before trusting `no_results`.
   */
  icons_searched: { query: string; results: number; no_results: boolean; semantic_ready: boolean };
  /** An install/API snippet was copied — the top of the MCP funnel. */
  snippet_copied: { context: string };
};

// Mirrors the guard in instrumentation-client.ts: without a token PostHog was
// never initialized, and capture() on an uninitialized client only warns.
const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

export function track<K extends keyof Events>(event: K, props: Events[K]) {
  if (!enabled) return;
  posthog.capture(event, props);
}
