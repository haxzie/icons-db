/**
 * Per-shelf artwork: the palette and the icons each library category is drawn
 * from. Pure data with no imports, because three very different things read it:
 * `scripts/build-category-covers.mjs` (bakes the committed cover SVGs on bare
 * node), the shelf pages, and the OG image route (satori, on Workers). Keeping
 * one copy is what stops a card, its page banner and its share preview from
 * drifting into three different-looking things.
 *
 * Each pool is drawn only from sets that are actually on that shelf, so the art
 * is a true sample rather than a mood board. Sets we do not ship as an
 * @iconify-json package (dither, lobehub) cannot be read by the cover script
 * and are left out.
 */
export type CategoryArt = {
  /** Gradient endpoints, top-left to bottom-right. */
  from: string;
  to: string;
  /** Corner glow. */
  glow: string;
  /** Icon tile fill and border. */
  tile: string;
  stroke: string;
  /** Colour for icons that inherit it; multicolour sets ignore it. */
  ink: string;
  /** Iconify ids, cycled over the grid. */
  pool: string[];
  /** Icons to render as a still instead of leaving them animating. */
  freeze?: (id: string) => boolean;
};

export const CATEGORY_ART: Record<string, CategoryArt> = {
  essentials: {
    from: "#0b57d0", to: "#09306e", glow: "#4c8dff", tile: "rgba(255,255,255,0.10)", stroke: "rgba(255,255,255,0.16)", ink: "#eaf1ff",
    pool: [
      "lucide:house", "lucide:search", "lucide:settings", "lucide:heart", "lucide:star", "lucide:bell",
      "tabler:user", "tabler:camera", "heroicons:bookmark", "ph:chat-circle", "feather:mail", "iconoir:calendar",
      "radix-icons:gear", "carbon:idea", "bi:cloud-fill", "mingcute:add-line", "solar:bolt-linear", "hugeicons:folder-01",
      "akar-icons:link-chain", "gg:trash", "flowbite:download-solid", "ri:share-forward-line", "ion:play", "teenyicons:bulb-on-outline",
    ],
  },
  "brand-logos": {
    from: "#1f2430", to: "#0a0d14", glow: "#4f5d78", tile: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.14)", ink: "#ffffff",
    pool: [
      "logos:react", "logos:figma", "logos:vue", "logos:svelte-icon", "logos:nodejs-icon", "logos:tailwindcss-icon",
      "logos:docker-icon", "logos:typescript-icon", "logos:python", "logos:rust", "logos:aws", "logos:postgresql",
      "logos:redis", "logos:kubernetes", "logos:nextjs-icon", "logos:vitejs", "simple-icons:github", "simple-icons:notion",
      "simple-icons:stripe", "simple-icons:linear", "simple-icons:x", "simple-icons:vercel",
    ],
  },
  animated: {
    from: "#5522cf", to: "#17083e", glow: "#a97cff", tile: "rgba(255,255,255,0.10)", stroke: "rgba(255,255,255,0.16)", ink: "#f3ecff",
    // svg-spinners loop forever and are drawn at every instant, so they are left
    // live and the card really does move. The rest draw themselves in from
    // nothing and would mostly be missing from a still.
    freeze: (id) => !id.startsWith("svg-spinners:"),
    pool: [
      "svg-spinners:ring-resize", "svg-spinners:bars-scale", "svg-spinners:3-dots-bounce", "svg-spinners:pulse",
      "svg-spinners:90-ring-with-bg", "svg-spinners:blocks-shuffle-3", "svg-spinners:gooey-balls-1", "svg-spinners:bouncing-ball",
      "line-md:loading-loop", "line-md:bell-loop", "line-md:heart-filled", "line-md:check-all", "line-md:downloading-loop",
      "line-md:cloud-alt-upload-loop", "line-md:search", "line-md:star-filled", "line-md:emoji-smile", "line-md:sun-rising-loop",
      "eos-icons:loading", "eos-icons:bubble-loading", "eos-icons:three-dots-loading",
    ],
  },
  emoji: {
    from: "#ff9a3c", to: "#c2185b", glow: "#ffd166", tile: "rgba(255,255,255,0.16)", stroke: "rgba(255,255,255,0.22)", ink: "#ffffff",
    pool: [
      "fluent-emoji-flat:party-popper", "fluent-emoji-flat:rocket", "fluent-emoji-flat:fire", "fluent-emoji-flat:red-heart",
      "fluent-emoji-flat:sparkles", "fluent-emoji-flat:grinning-face", "fluent-emoji-flat:sunflower", "fluent-emoji-flat:pizza",
      "noto:star", "noto:smiling-face-with-heart-eyes", "noto:party-popper", "noto:rocket", "noto:pizza", "noto:sunflower",
      "twemoji:red-heart", "twemoji:fire", "twemoji:sparkles", "openmoji:rocket", "openmoji:red-heart", "emojione:rocket",
    ],
  },
  developer: {
    from: "#17223b", to: "#070b16", glow: "#3d7dff", tile: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.14)", ink: "#cdd6f4",
    pool: [
      "vscode-icons:file-type-typescript", "vscode-icons:file-type-reactjs", "vscode-icons:file-type-rust",
      "vscode-icons:file-type-python", "vscode-icons:file-type-docker2", "vscode-icons:file-type-js-official",
      "devicon:python", "devicon:go", "devicon:rust", "devicon:docker", "devicon:react", "devicon:nodejs",
      "skill-icons:rust", "skill-icons:typescript", "skill-icons:kubernetes", "material-icon-theme:folder-src-open",
      "catppuccin:typescript", "catppuccin:rust", "codicon:terminal", "codicon:git-merge", "octicon:repo-16", "octicon:git-branch-16",
    ],
  },
  multicolor: {
    from: "#0f766e", to: "#053b45", glow: "#2dd4bf", tile: "rgba(255,255,255,0.12)", stroke: "rgba(255,255,255,0.18)", ink: "#ffffff",
    pool: [
      "fluent-color:calendar-16", "fluent-color:mail-16", "fluent-color:chat-16", "fluent-color:image-16",
      "fluent-color:star-16", "fluent-color:heart-16", "fluent-color:alert-16", "fluent-color:settings-16",
      "fluent-color:person-16", "fluent-color:document-16", "icon-park:like", "icon-park:camera-one",
      "icon-park:rocket-one", "icon-park:alarm-clock", "icon-park:music-menu", "icon-park:shopping-cart",
      "icon-park:color-card", "logos:figma", "material-icon-theme:folder-src", "vscode-icons:file-type-reactjs",
    ],
  },
  "crypto-finance": {
    from: "#1a7f5a", to: "#07271c", glow: "#f7b32b", tile: "rgba(255,255,255,0.10)", stroke: "rgba(255,255,255,0.16)", ink: "#e8fff4",
    pool: [
      "token-branded:bitcoin", "token-branded:ethereum", "token-branded:usdt", "token-branded:solana",
      "token-branded:usdc", "token-branded:binance", "token:btc", "token:eth", "token:sol", "token:ada",
      "token:doge", "token:bnb", "lucide:trending-up", "lucide:wallet", "lucide:credit-card", "lucide:coins",
      "lucide:piggy-bank", "lucide:landmark", "ph:chart-line-up-fill", "ph:currency-dollar-fill",
    ],
  },
  flags: {
    from: "#1d6fd1", to: "#0a2a52", glow: "#7cc0ff", tile: "rgba(255,255,255,0.12)", stroke: "rgba(255,255,255,0.18)", ink: "#ffffff",
    pool: [
      "circle-flags:us", "circle-flags:jp", "circle-flags:in", "circle-flags:br", "circle-flags:de", "circle-flags:fr",
      "circle-flags:gb", "circle-flags:ke", "circle-flags:za", "circle-flags:mx", "flag:de-4x3", "flag:it-4x3",
      "flag:es-4x3", "flagpack:fr", "flagpack:nl", "flagpack:se",
    ],
  },
  material: {
    from: "#1a73e8", to: "#0b3d91", glow: "#8ab4f8", tile: "rgba(255,255,255,0.14)", stroke: "rgba(255,255,255,0.2)", ink: "#ffffff",
    pool: [
      "material-symbols:favorite-rounded", "material-symbols:search-rounded", "material-symbols:home-rounded",
      "material-symbols:android", "material-symbols:bolt-rounded", "material-symbols:mail-rounded",
      "material-symbols:settings-rounded", "material-symbols:rocket-launch-rounded", "mdi:heart", "mdi:home",
      "mdi:android", "mdi:music", "mdi:google", "mdi:bell", "mdi:camera", "ic:round-favorite", "ic:round-home",
      "ic:round-star", "ic:round-search", "line-md:check-all",
    ],
  },
  pixel: {
    from: "#3a4120", to: "#0b0d07", glow: "#a3e635", tile: "rgba(163,230,53,0.12)", stroke: "rgba(163,230,53,0.26)", ink: "#dcff86",
    pool: [
      "pixelarticons:heart", "pixelarticons:gamepad", "pixelarticons:camera", "pixelarticons:music",
      "pixelarticons:sun-alt", "pixelarticons:trophy", "pixelarticons:coin", "pixelarticons:mail",
      "pixelarticons:chess", "pixelarticons:cloud", "pixelarticons:zap", "pixelarticons:moon-star",
    ],
  },
};
