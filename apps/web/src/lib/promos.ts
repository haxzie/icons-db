export type Promo = {
  id: string;
  title: string;
  tagline: string;
  href: string;
  /** Iconify id rendered through our own API, e.g. "lucide:sparkles" */
  icon: string;
  sponsored?: boolean;
};

export const PROMOS: Promo[] = [
  { id: "prequel", title: "Prequel", tagline: "Create cinematic screen recordings on Mac", href: "https://prequel.sh?ref=iconsdb", icon: "lucide:clapperboard", sponsored: true },
  { id: "genmotion", title: "GenMotion", tagline: "Create viral launch videos using Claude Code", href: "https://genmotion.dev?ref=iconsdb", icon: "lucide:sparkles", sponsored: true },
  { id: "advertise", title: "Advertise with us", tagline: "Reach developers and designers searching for icons", href: "mailto:musthu.gm@gmail.com?subject=Advertise%20on%20IconsDB", icon: "lucide:megaphone" },
  { id: "mcp", title: "MCP for coding agents", tagline: "Claude Code, Cursor & Codex search icons by intent", href: "/install", icon: "lucide:bot" },
  { id: "licenses", title: "Licenses", tagline: "What attribution each set needs", href: "/licenses", icon: "lucide:scale" },
];
