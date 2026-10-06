import ReactDOM from "react-dom";

// The keyword index is ~1.6 MB brotli (8.8 MB parsed) and nothing asks for it
// until SearchApp/CollectionBrowser hydrate — measured ~450ms into a warm
// production load, longer on a cold one. That gap is what the "loading index…"
// note in the result count reports.
//
// A resource hint closes it: the preload scanner reads this out of the raw HTML
// bytes ahead of the parser, so the download overlaps the stylesheet and the
// ~900 KB of bundle rather than queueing behind them. An inline <script> cannot
// do this job — React hoists it below the stylesheet and the parser-blocking
// bundle tags, and an inline script waits on pending stylesheets, which
// measured 228ms late in production.
//
// `low` on purpose: nothing needs the index until someone types, so it must not
// out-rank the bundles that hydrate the page. Whoever fetches it first then gets
// the warmed entry and shares it (see lib/search-index-source.ts).
export function PreloadSearchIndex() {
  ReactDOM.preload("/data/search-index.json", { as: "fetch", fetchPriority: "low" });
  return null;
}
