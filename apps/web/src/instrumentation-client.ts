import posthog from "posthog-js";

// Runs after the document loads but before hydration, so the first pageview is
// captured even if the visitor leaves before React is interactive.
//
// Guarded like NEXT_PUBLIC_GA_ID in app/layout.tsx: the token is inlined at
// build time, so a dev build without it would otherwise init PostHog with
// `undefined` and send every local click to nowhere.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
  });
}
