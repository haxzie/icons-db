/** Routes whose client components call `useKeywordIndex`: `/` (SearchApp) and
 *  `/library/<prefix>` (CollectionBrowser). `/library` and
 *  `/library/category/<slug>` render from server data and must not pay for it. */
const NEEDS_INDEX = /^\/$|^\/library\/(?!category(\/|$))[^/]+\/?$/;

// The keyword index is ~1.7 MB brotli (8.8 MB parsed) and three consumers want
// it on a search route: the grid on the main thread, the keyword-index worker,
// and the semantic worker. Left to the hooks' effects the download cannot even
// start until ~900 KB of bundle has landed and hydrated — measured ~450ms
// after the HTML arrived on a warm cache, and longer on a cold one. That gap is
// what the "loading index…" note in the result count reports.
//
// Firing the fetch from here gets it moving while the HTML is still streaming,
// and parking the single ArrayBuffer on `window` lets both workers read those
// bytes instead of re-fetching and re-decompressing the same response (see
// lib/search-index-source.ts). Low priority on purpose: nothing needs the index
// until someone types, so it must not out-rank the bundles that hydrate the
// page. The handle is dropped after a minute rather than retained for the
// session; anyone asking later re-reads the bytes from the HTTP cache.
//
// This lives in the root layout's <head> rather than in the two route layouts
// because that is the one place Next.js is guaranteed to emit it as a real
// executable <script> in the streamed HTML — hence the path test.
export const prefetchIndexScript = `(function(){try{if(!${NEEDS_INDEX.toString()}.test(location.pathname))return;window.__iconsIndex=fetch("/data/search-index.json",{priority:"low"}).then(function(r){return r.ok?r.arrayBuffer():null}).catch(function(){return null});setTimeout(function(){window.__iconsIndex=null},60000)}catch(e){}})();`;
