export type Framework = "react" | "vue" | "svelte" | "solid" | "js";

export type PackageInfo = {
  /** npm package name, e.g. "lucide-react" */
  npm: string;
  framework: Framework;
  /** Build the exported symbol for an icon name (kebab-case, style suffix included). */
  symbol: (name: string, style: string) => string;
  /** Build the import path — defaults to `npm`. Some packages split by style. */
  path?: (name: string, style: string) => string;
  /** Render a usage line; defaults to `<Symbol />`. */
  usage?: (symbol: string) => string;
  note?: string;
};

export function pascal(name: string): string {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("")
    .replace(/^(\d)/, "Icon$1");
}

const camel = (s: string) => {
  const p = pascal(s);
  return p[0].toLowerCase() + p.slice(1);
};

const strip = (name: string, suffix: string) => (suffix && name.endsWith("-" + suffix) ? name.slice(0, -(suffix.length + 1)) : name);
const heroName = (n: string) => n.replace(/-(16|20)-solid$/, "").replace(/-solid$/, "");
const heroPath = (base: string, style: string) =>
  `${base}/${/20/.test(style) ? "20/solid" : /16/.test(style) ? "16/solid" : /solid/i.test(style) ? "24/solid" : "24/outline"}`;

// react-icons bundles many sets; symbol = <Prefix><PascalName>
const reactIcons = (sub: string, symPrefix: string, framework: Framework = "react"): PackageInfo => ({
  npm: "react-icons",
  framework,
  symbol: (n) => symPrefix + pascal(n),
  path: () => `react-icons/${sub}`,
});

/** Per-set npm packages, most idiomatic first. */
export const SET_PACKAGES: Record<string, PackageInfo[]> = {
  lucide: [
    { npm: "lucide-react", framework: "react", symbol: (n) => pascal(n) },
    { npm: "lucide-vue-next", framework: "vue", symbol: (n) => pascal(n) },
    { npm: "@lucide/svelte", framework: "svelte", symbol: (n) => pascal(n) },
    { npm: "lucide-solid", framework: "solid", symbol: (n) => pascal(n) },
    { npm: "lucide", framework: "js", symbol: (n) => pascal(n), usage: (s) => `createElement(${s})` },
  ],
  heroicons: [
    { npm: "@heroicons/react", framework: "react", symbol: (n) => pascal(heroName(n)) + "Icon", path: (_n, style) => heroPath("@heroicons/react", style) },
    { npm: "@heroicons/vue", framework: "vue", symbol: (n) => pascal(heroName(n)) + "Icon", path: (_n, style) => heroPath("@heroicons/vue", style) },
  ],
  tabler: [
    { npm: "@tabler/icons-react", framework: "react", symbol: (n) => "Icon" + pascal(n) },
    { npm: "@tabler/icons-vue", framework: "vue", symbol: (n) => "Icon" + pascal(n) },
    { npm: "@tabler/icons-svelte", framework: "svelte", symbol: (n) => "Icon" + pascal(n) },
    { npm: "@tabler/icons-solidjs", framework: "solid", symbol: (n) => "Icon" + pascal(n) },
  ],
  ph: [
    {
      npm: "@phosphor-icons/react",
      framework: "react",
      symbol: (n, style) => pascal(strip(n, style.toLowerCase())),
      usage: (s) => `<${s} />`,
      note: 'Style is a prop: weight="regular|thin|light|bold|fill|duotone".',
    },
    { npm: "@phosphor-icons/vue", framework: "vue", symbol: (n, style) => "Ph" + pascal(strip(n, style.toLowerCase())), note: 'Style is a prop: weight="…".' },
  ],
  ri: [{ npm: "@remixicon/react", framework: "react", symbol: (n) => "Ri" + pascal(n) }],
  bi: [{ npm: "react-bootstrap-icons", framework: "react", symbol: (n) => pascal(n) }, reactIcons("bs", "Bs")],
  mdi: [
    { npm: "@mdi/js", framework: "js", symbol: (n) => "mdi" + pascal(n), usage: (s) => `<Icon path={${s}} size={1} />  // from @mdi/react` },
    reactIcons("md", "Md"),
  ],
  "fa6-solid": [
    { npm: "@fortawesome/free-solid-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />  // from @fortawesome/react-fontawesome` },
    reactIcons("fa6", "Fa"),
  ],
  "fa6-regular": [
    { npm: "@fortawesome/free-regular-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />` },
    reactIcons("fa6", "FaRegular"),
  ],
  "fa6-brands": [
    { npm: "@fortawesome/free-brands-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />` },
    reactIcons("fa6", "Fa"),
  ],
  ion: [reactIcons("io5", "Io")],
  feather: [{ npm: "react-feather", framework: "react", symbol: (n) => pascal(n) }, reactIcons("fi", "Fi")],
  octicon: [{ npm: "@primer/octicons-react", framework: "react", symbol: (n, style) => pascal(strip(n, style === "24" || style === "16" ? style : "")) + "Icon" }, reactIcons("go", "Go")],
  "radix-icons": [{ npm: "@radix-ui/react-icons", framework: "react", symbol: (n) => pascal(n) + "Icon" }],
  "simple-icons": [{ npm: "simple-icons", framework: "js", symbol: (n) => "si" + pascal(n), usage: (s) => `${s}.svg / ${s}.hex` }, reactIcons("si", "Si")],
  bx: [reactIcons("bi", "Bi")],
  bxs: [reactIcons("bi", "Bis")],
  bxl: [reactIcons("bi", "Bil")],
  "akar-icons": [{ npm: "akar-icons", framework: "react", symbol: (n) => pascal(n) }],
  gg: [reactIcons("cg", "Cg")],
  iconoir: [{ npm: "iconoir-react", framework: "react", symbol: (n) => pascal(n) }, { npm: "iconoir-vue", framework: "vue", symbol: (n) => pascal(n) }],
  carbon: [{ npm: "@carbon/icons-react", framework: "react", symbol: (n) => pascal(n) }, reactIcons("ci", "Ci")],
  fluent: [{ npm: "@fluentui/react-icons", framework: "react", symbol: (n) => pascal(n) }],
  teenyicons: [{ npm: "teenyicons", framework: "js", symbol: (n) => camel(n) }],
  hugeicons: [{ npm: "@hugeicons/core-free-icons", framework: "js", symbol: (n) => pascal(n) + "Icon", usage: (s) => `<HugeiconsIcon icon={${s}} />  // from @hugeicons/react` }],
  "line-md": [reactIcons("lia", "Lia")],
  la: [reactIcons("lia", "Lia")],
  eva: [{ npm: "eva-icons", framework: "js", symbol: (n) => camel(n) }],
  uil: [{ npm: "@iconscout/react-unicons", framework: "react", symbol: (n) => "Uil" + pascal(n) }],
  weui: [reactIcons("wi", "Wi")],
  pixelarticons: [reactIcons("pi", "Pi")],
  f7: [{ npm: "framework7-icons", framework: "js", symbol: (n) => n, usage: (s) => `<i class="f7-icons">${s.replace(/-/g, "_")}</i>` }],
  devicon: [{ npm: "devicons-react", framework: "react", symbol: (n) => pascal(n) }, reactIcons("di", "Di")],
  ic: [
    { npm: "@mui/icons-material", framework: "react", symbol: (n) => pascal(n.replace(/^baseline-/, "").replace(/^(outline|round|sharp|twotone)-(.*)$/, "$2-$1")), note: "Names: Home, HomeOutlined, HomeRounded, HomeSharp, HomeTwoTone." },
    reactIcons("md", "Md"),
  ],
  "material-symbols-light": [{ npm: "material-symbols", framework: "js", symbol: (n) => n, usage: (s) => `<span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300">${s.replace(/-(outline|rounded|sharp)$/, "").replace(/-/g, "_")}</span>` }],
  "fa7-solid": [{ npm: "@fortawesome/free-solid-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />  // from @fortawesome/react-fontawesome` }, reactIcons("fa6", "Fa")],
  "fa7-regular": [{ npm: "@fortawesome/free-regular-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />` }, reactIcons("fa6", "FaRegular")],
  "fa7-brands": [{ npm: "@fortawesome/free-brands-svg-icons", framework: "js", symbol: (n) => "fa" + pascal(n), usage: (s) => `<FontAwesomeIcon icon={${s}} />` }, reactIcons("fa6", "Fa")],
  "icon-park-outline": [{ npm: "@icon-park/react", framework: "react", symbol: (n) => pascal(n), usage: (s) => `<${s} theme="outline" />` }, { npm: "@icon-park/vue-next", framework: "vue", symbol: (n) => pascal(n), usage: (s) => `<${s.toLowerCase()} theme="outline" />` }],
  "icon-park-solid": [{ npm: "@icon-park/react", framework: "react", symbol: (n) => pascal(n), usage: (s) => `<${s} theme="filled" />` }],
  "icon-park-twotone": [{ npm: "@icon-park/react", framework: "react", symbol: (n) => pascal(n), usage: (s) => `<${s} theme="two-tone" />` }],
  "icon-park": [{ npm: "@icon-park/react", framework: "react", symbol: (n) => pascal(n), usage: (s) => `<${s} theme="multi-color" />` }],
  mynaui: [{ npm: "@mynaui/icons-react", framework: "react", symbol: (n) => pascal(n) }],
  tdesign: [{ npm: "tdesign-icons-react", framework: "react", symbol: (n) => pascal(n) + "Icon" }, { npm: "tdesign-icons-vue-next", framework: "vue", symbol: (n) => pascal(n) + "Icon" }],
  "ant-design": [{ npm: "@ant-design/icons", framework: "react", symbol: (n) => pascal(n) }, { npm: "@ant-design/icons-vue", framework: "vue", symbol: (n) => pascal(n) }, reactIcons("ai", "Ai")],
  prime: [{ npm: "primeicons", framework: "js", symbol: (n) => n, usage: (s) => `<i class="pi pi-${s}"></i>` }, reactIcons("pi", "Pi")],
  ep: [{ npm: "@element-plus/icons-vue", framework: "vue", symbol: (n) => pascal(n) }],
  flowbite: [{ npm: "flowbite-react-icons", framework: "react", symbol: (n, style) => pascal(n.replace(/-(outline|solid)$/, "")), path: (_n, style) => `flowbite-react-icons/${/solid/i.test(style) ? "solid" : "outline"}` }],
  codicon: [{ npm: "@vscode/codicons", framework: "js", symbol: (n) => n, usage: (s) => `<i class="codicon codicon-${s}"></i>` }, reactIcons("vsc", "Vsc")],
  "lucide-lab": [{ npm: "@lucide/lab", framework: "js", symbol: (n) => camel(n), usage: (s) => `<Icon iconNode={${s}} />  // Icon from lucide-react` }],
  healthicons: [{ npm: "healthicons", framework: "js", symbol: (n) => n, usage: (s) => `healthicons/public/icons/svg/filled/…/${s}.svg` }],
  cib: [{ npm: "@coreui/icons", framework: "js", symbol: (n) => "cib" + pascal(n), usage: (s) => `<CIcon icon={${s}} />  // from @coreui/icons-react` }],
  token: [{ npm: "@web3icons/react", framework: "react", symbol: (n) => "Token" + pascal(n).toUpperCase(), usage: (s) => `<${s} variant="mono" />` }],
  "token-branded": [{ npm: "@web3icons/react", framework: "react", symbol: (n) => "Token" + pascal(n.replace(/-background$/, "")).toUpperCase(), usage: (s) => `<${s} variant="branded" />` }],
  "circle-flags": [{ npm: "react-circle-flags", framework: "react", symbol: () => "CircleFlag", usage: () => `<CircleFlag countryCode="…" />` }],
};

/** Universal packages that work for every set, keyed by framework. */
export const UNIVERSAL_PACKAGES: Record<Framework, { npm: string; render: (id: string) => string }> = {
  react: { npm: "@iconify/react", render: (id) => `import { Icon } from "@iconify/react";\n<Icon icon="${id}" />` },
  vue: { npm: "@iconify/vue", render: (id) => `import { Icon } from "@iconify/vue";\n<Icon icon="${id}" />` },
  svelte: { npm: "@iconify/svelte", render: (id) => `import Icon from "@iconify/svelte";\n<Icon icon="${id}" />` },
  solid: { npm: "@iconify-icon/solid", render: (id) => `import { IconifyIcon } from "@iconify-icon/solid";\n<IconifyIcon icon="${id}" />` },
  js: { npm: "iconify-icon", render: (id) => `import "iconify-icon";\n<iconify-icon icon="${id}"></iconify-icon>` },
};

const REVERSE = new Map<string, string[]>();
for (const [prefix, list] of Object.entries(SET_PACKAGES)) {
  for (const p of list) {
    const arr = REVERSE.get(p.npm) ?? [];
    if (!arr.includes(prefix)) arr.push(prefix);
    REVERSE.set(p.npm, arr);
  }
}

/** Set prefixes an npm package provides (react-icons maps to many). */
export function setsForPackage(npm: string): string[] {
  return REVERSE.get(npm) ?? [];
}

export type DetectedPackage = { npm: string; sets: string[]; framework: Framework };

export function detectIconPackages(dependencies: string[]): DetectedPackage[] {
  const out: DetectedPackage[] = [];
  for (const dep of dependencies) {
    const sets = REVERSE.get(dep);
    if (sets?.length) {
      const fw = SET_PACKAGES[sets[0]].find((p) => p.npm === dep)?.framework ?? "js";
      out.push({ npm: dep, sets, framework: fw });
    }
    for (const [fw, u] of Object.entries(UNIVERSAL_PACKAGES) as [Framework, { npm: string }][]) {
      if (u.npm === dep) out.push({ npm: dep, sets: ["*"], framework: fw });
    }
    if (dep === "unplugin-icons") out.push({ npm: dep, sets: ["*"], framework: "js" });
  }
  return out;
}

/** Ready-to-paste import for an icon from the set's own package, if any. */
export function packageImport(
  prefix: string,
  name: string,
  style: string,
  framework: Framework,
  preferNpm?: string,
): { npm: string; code: string; note?: string } | null {
  const list = SET_PACKAGES[prefix];
  if (!list) return null;
  const p =
    (preferNpm && list.find((x) => x.npm === preferNpm)) ??
    list.find((x) => x.framework === framework) ??
    (framework === "react" ? list.find((x) => x.framework === "js") : undefined);
  if (!p) return null;
  const sym = p.symbol(name, style);
  const path = p.path ? p.path(name, style) : p.npm;
  const usage = p.usage ? p.usage(sym) : `<${sym} />`;
  return { npm: p.npm, code: `import { ${sym} } from "${path}";\n${usage}`, note: p.note };
}
