import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { detectIconPackages, humanize, SET_PACKAGES, setsForPackage, type StyleBucket } from "@icons-db/core";
import { collectionByPrefix, collections } from "@/lib/collections";
import { getIcon, getIcons, getSameFamilyAcrossSets, getVariants } from "@/lib/db";
import { search } from "@/lib/search.server";
import { codeFor, groupedLine, groupHits, licenseLabel, licenseLine, SITE, text, TRADEMARK, type IconFormat, type SearchFilters } from "./format";

const ID = /^[a-z0-9-]+:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORMAT = z.enum(["react", "vue", "svelte", "solid", "svg", "jsx", "iconify", "unplugin", "css", "data-uri", "all"]);
const KIND = z.enum(["icons", "emoji", "brands"]);
const STYLE = z.enum(["outline", "filled", "duotone", "light", "color"]);
const LICENSE = z.enum(["permissive", "no-attribution"]);

function resolveSets(pkg?: string, sets?: string[]): { sets?: string[]; note?: string } {
  if (sets?.length) {
    const unknown = sets.filter((s) => !collectionByPrefix.has(s));
    return { sets: sets.filter((s) => collectionByPrefix.has(s)), note: unknown.length ? `Unknown sets ignored: ${unknown.join(", ")}` : undefined };
  }
  if (pkg) {
    const found = setsForPackage(pkg);
    if (found.length) return { sets: found };
    return { note: `No icon set maps to package "${pkg}"; searched all sets. Use @iconify/react or unplugin-icons to consume any result.` };
  }
  return {};
}

export function registerTools(server: McpServer, origin: string) {
  server.registerTool(
    "search_icons",
    {
      title: "Search icons",
      description:
        "Find open source icons, logos or emoji by meaning (e.g. \"shopping cart\", \"log out\", \"github\"). " +
        "Searches 146k icons across 57 sets with hybrid keyword + semantic ranking. " +
        "If the project already depends on an icon package (lucide-react, @heroicons/react, @tabler/icons-react, react-icons, …) pass it as `package` so every result is importable without adding a dependency. " +
        "Pass several `queries` when you need a consistent set of icons for one UI (nav bar, toolbar): the response says which sets cover all of them. " +
        "Results are one row per icon family; call get_icon for code.",
      inputSchema: z.object({
        query: z.string().min(1).max(100).optional().describe("What the icon should depict, in plain words"),
        queries: z.array(z.string().min(1).max(100)).min(1).max(8).optional().describe("Several concepts at once, to pick one consistent set"),
        package: z.string().max(80).optional().describe("npm package already in the project, e.g. lucide-react"),
        sets: z.array(z.string()).max(20).optional().describe("Restrict to set prefixes, e.g. [\"lucide\",\"tabler\"]"),
        kind: KIND.optional().describe("icons (UI), emoji, or brands (logos, file types, flags)"),
        style: STYLE.optional(),
        license: LICENSE.optional().describe("no-attribution hides CC-BY sets"),
        limit: z.number().int().min(1).max(50).optional().describe("Rows per query, default 10"),
      }),
    },
    async (args) => {
      const queries = args.queries ?? (args.query ? [args.query] : []);
      if (!queries.length) return text("Provide `query` or `queries`.");
      const limit = args.limit ?? 10;
      const { sets, note } = resolveSets(args.package, args.sets);
      const filters: SearchFilters = { sets, kind: args.kind, style: args.style as StyleBucket | undefined, license: args.license };

      const perQuery = await Promise.all(
        queries.map(async (q) => {
          const { hits } = await search(origin, q, { mode: "hybrid", limit: 400, prefixes: sets });
          return { q, rows: groupHits(hits, filters, queries.length > 1 ? Math.max(limit, 30) : limit) };
        }),
      );

      const lines: string[] = [];
      if (note) lines.push(note, "");
      let brands = false;
      if (perQuery.length === 1) {
        const { q, rows } = perQuery[0];
        lines.push(`${rows.length} results for "${q}":`);
        for (const r of rows) lines.push(groupedLine(r));
        brands = rows.some((r) => collectionByPrefix.get(r.prefix)?.kind === "brands");
        if (!rows.length) lines.push("No matches. Try a synonym (e.g. \"trash\" vs \"delete\"), drop the style/license filter, or search all sets.");
      } else {
        const coverage = new Map<string, Map<string, (typeof perQuery)[0]["rows"][0]>>();
        for (const { q, rows } of perQuery) {
          for (const r of rows) {
            const m = coverage.get(r.prefix) ?? new Map();
            if (!m.has(q)) m.set(q, r);
            coverage.set(r.prefix, m);
          }
        }
        const full = [...coverage.entries()].filter(([, m]) => m.size === queries.length).sort((a, b) => {
          const sa = [...a[1].values()].reduce((n, r) => n + r.score, 0);
          const sb = [...b[1].values()].reduce((n, r) => n + r.score, 0);
          return sb - sa;
        });
        if (full.length) {
          lines.push(`Sets covering all ${queries.length} concepts (best first): ${full.map(([p]) => p).join(", ")}`, "");
          for (const [p, m] of full.slice(0, 5)) {
            const c = collectionByPrefix.get(p)!;
            lines.push(`${c.name} (${p}) · ${licenseLabel(c)}${c.license.attribution ? " (attribution)" : ""}:`);
            for (const q of queries) lines.push(`  ${q} → ${m.get(q)!.id}${m.get(q)!.styles.length > 1 ? ` (${m.get(q)!.styles.join("/")})` : ""}`);
            lines.push("");
          }
        } else {
          lines.push("No single set covers every concept. Per-concept results:");
          for (const { q, rows } of perQuery) {
            lines.push(`"${q}":`);
            for (const r of rows.slice(0, limit)) lines.push("  " + groupedLine(r));
          }
        }
      }
      if (brands) lines.push("", TRADEMARK);
      const first = perQuery[0].rows[0];
      lines.push("", `Next: get_icon id="${first?.id ?? "lucide:house"}" format=react|vue|svelte|svg — or get_icons for several at once.`);
      return {
        ...text(lines.join("\n")),
        structuredContent: { results: Object.fromEntries(perQuery.map(({ q, rows }) => [q, rows.map((r) => ({ id: r.id, set: r.set, styles: r.styles, license: r.license, attribution: r.attribution }))])) },
      };
    },
  );

  const iconOutput = async (id: string, format: IconFormat, opts: { color?: string; size?: number; package?: string }, brief: boolean) => {
    const [prefix, name] = id.split(":");
    const icon = await getIcon(prefix, name);
    const c = collectionByPrefix.get(prefix);
    if (!icon || !c) return { lines: [`${id}: not found. Use search_icons to find valid ids.`], data: null };
    const { blocks, svg } = codeFor(icon, c, format, opts);
    const lines = [`# ${id} — ${humanize(icon.family)} (${c.name}, ${icon.style})`];
    for (const b of brief ? blocks.slice(0, 1) : blocks) {
      lines.push(`## ${b.label}`, "```", b.code.trimEnd(), "```");
      if (b.note) lines.push(b.note);
    }
    return { lines, data: { id, set: c.name, style: icon.style, license: licenseLabel(c), attribution: c.license.attribution, svg: format === "svg" || format === "all" ? svg : undefined, code: blocks } };
  };

  server.registerTool(
    "get_icon",
    {
      title: "Get icon code",
      description:
        "Return ready-to-paste code for one icon id (from search_icons, e.g. \"lucide:house\"). " +
        "format=react|vue|svelte|solid gives the set's own npm package import when one exists, the @iconify universal component, and an inline no-dependency component. " +
        "format=svg returns the raw SVG; jsx an inline React component; css/data-uri for backgrounds; all for everything. Also lists style variants and the same icon in other sets.",
      inputSchema: z.object({
        id: z.string().regex(ID).describe("prefix:name, e.g. lucide:house"),
        format: FORMAT.optional().describe("default react"),
        color: z.string().max(32).optional().describe("Bake a colour into the SVG, e.g. #1a73e8 (monochrome sets only)"),
        size: z.number().int().min(8).max(1024).optional().describe("Pixel size for the SVG; default 1em"),
        package: z.string().max(80).optional().describe("Prefer this npm package for the import, e.g. @mdi/js instead of react-icons"),
      }),
    },
    async ({ id, format = "react", color, size, package: pkg }) => {
      const { lines, data } = await iconOutput(id, format, { color, size, package: pkg }, false);
      if (!data) return text(lines.join("\n"));
      const [prefix] = id.split(":");
      const icon = (await getIcon(prefix, id.split(":")[1]))!;
      const c = collectionByPrefix.get(prefix)!;
      const [variants, across] = await Promise.all([getVariants(prefix, icon.family), getSameFamilyAcrossSets(prefix, icon.family, 6)]);
      const others = variants.filter((v) => v.name !== icon.name);
      if (others.length) lines.push("", `Variants: ${others.map((v) => `${prefix}:${v.name} (${v.style})`).join(", ")}`);
      if (across.length) lines.push(`Same icon in other sets: ${across.map((a) => `${a.prefix}:${a.name}`).join(", ")}`);
      lines.push("", licenseLine(c));
      if (c.kind === "brands") lines.push(TRADEMARK);
      lines.push(`Page: ${SITE}/icon/${prefix}/${icon.name} · SVG: ${SITE}/api/v1/icon/${prefix}/${icon.name}.svg`);
      return { ...text(lines.join("\n")), structuredContent: { ...data, variants: others.map((v) => ({ id: `${prefix}:${v.name}`, style: v.style })), sameInOtherSets: across.map((a) => `${a.prefix}:${a.name}`) } };
    },
  );

  server.registerTool(
    "get_icons",
    {
      title: "Get several icons",
      description: "Batch version of get_icon for building a whole nav/toolbar in one call. Returns the single best code block per icon (package import when available) plus licence summary.",
      inputSchema: z.object({
        ids: z.array(z.string().regex(ID)).min(1).max(40),
        format: FORMAT.optional().describe("default react"),
        color: z.string().max(32).optional(),
        size: z.number().int().min(8).max(1024).optional(),
        package: z.string().max(80).optional().describe("Prefer this npm package for imports"),
      }),
    },
    async ({ ids, format = "react", color, size, package: pkg }) => {
      const byPrefix = new Map<string, string[]>();
      for (const id of ids) {
        const [p, n] = id.split(":");
        byPrefix.set(p, [...(byPrefix.get(p) ?? []), n]);
      }
      const found = new Map<string, Awaited<ReturnType<typeof getIcons>>[0]>();
      await Promise.all([...byPrefix.entries()].map(async ([p, names]) => (await getIcons(p, names)).forEach((i) => found.set(`${p}:${i.name}`, i))));
      const lines: string[] = [];
      const data: unknown[] = [];
      const sets = new Set<string>();
      for (const id of ids) {
        const icon = found.get(id);
        const c = collectionByPrefix.get(id.split(":")[0]);
        if (!icon || !c) {
          lines.push(`${id}: not found`);
          continue;
        }
        sets.add(c.prefix);
        const { blocks, svg } = codeFor(icon, c, format, { color, size, package: pkg });
        const b = blocks[0];
        lines.push(`## ${id} (${icon.style})`, "```", b.code.trimEnd(), "```");
        data.push({ id, style: icon.style, code: b.code, svg: format === "svg" || format === "all" ? svg : undefined });
      }
      lines.push("");
      for (const p of sets) lines.push(`${collectionByPrefix.get(p)!.name}: ${licenseLine(collectionByPrefix.get(p)!)}`);
      if ([...sets].some((p) => collectionByPrefix.get(p)?.kind === "brands")) lines.push(TRADEMARK);
      if (sets.size > 1) lines.push("", `Note: icons come from ${sets.size} different sets — mixing styles is usually a mistake; consider search_icons with queries[] to pick one set.`);
      return { ...text(lines.join("\n")), structuredContent: { icons: data } };
    },
  );

  server.registerTool(
    "list_icon_sets",
    {
      title: "List icon sets",
      description: "All 57 icon/logo/emoji sets with counts, license, attribution flag and npm packages. Filter by kind, license or package.",
      inputSchema: z.object({
        kind: KIND.optional(),
        license: LICENSE.optional(),
        package: z.string().max(80).optional().describe("Only sets provided by this npm package"),
      }),
    },
    async ({ kind, license, package: pkg }) => {
      const allow = pkg ? new Set(setsForPackage(pkg)) : null;
      const rows = collections
        .filter((c) => (!kind || c.kind === kind) && (license !== "no-attribution" || !c.license.attribution) && (!allow || allow.has(c.prefix)))
        .sort((a, b) => b.total - a.total);
      const lines = rows.map((c) => {
        const pkgs = (SET_PACKAGES[c.prefix] ?? []).map((p) => p.npm).filter((v, i, a) => a.indexOf(v) === i);
        return `${c.prefix} · ${c.name} · ${c.total.toLocaleString()} · ${c.kind} · ${licenseLabel(c)}${c.license.attribution ? " (attribution)" : ""}${pkgs.length ? ` · ${pkgs.join(", ")}` : ""}`;
      });
      lines.push("", "Every set also works with @iconify/react, @iconify/vue, @iconify/svelte and unplugin-icons (~icons/<prefix>/<name>).");
      return { ...text(lines.join("\n")), structuredContent: { sets: rows.map((c) => ({ prefix: c.prefix, name: c.name, total: c.total, kind: c.kind, license: licenseLabel(c), attribution: c.license.attribution, packages: (SET_PACKAGES[c.prefix] ?? []).map((p) => p.npm) })) } };
    },
  );

  server.registerTool(
    "detect_icon_packages",
    {
      title: "Detect installed icon packages",
      description:
        "Call this first with the project's dependency names (Object.keys of package.json dependencies + devDependencies). " +
        "Tells you which icon sets are already available so you can pass `package` to search_icons and avoid adding a new dependency.",
      inputSchema: z.object({ dependencies: z.array(z.string()).max(500) }),
    },
    async ({ dependencies }) => {
      const found = detectIconPackages(dependencies);
      if (!found.length) {
        return text(
          "No icon package detected. Options: (a) search all sets and use inline SVG/JSX from get_icon (zero dependencies); " +
            "(b) add @iconify/react (or @iconify/vue / @iconify/svelte) to use any icon by id; (c) add the set's own package, e.g. lucide-react, once you've picked a set with search_icons queries[].",
        );
      }
      const lines = found.map((f) => (f.sets[0] === "*" ? `${f.npm} (${f.framework}) — can render any set by id, e.g. icon="lucide:house"` : `${f.npm} (${f.framework}) → sets: ${f.sets.join(", ")}`));
      const first = found.find((f) => f.sets[0] !== "*");
      lines.push("", first ? `Next: search_icons query="…" package="${first.npm}" format hint: ${first.framework}` : `Next: search_icons query="…" (any set), then get_icon format=iconify`);
      return { ...text(lines.join("\n")), structuredContent: { packages: found } };
    },
  );

  server.registerResource(
    "sets",
    "iconsdb://sets",
    { title: "Icon sets", description: "All icon sets with licence and packages", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(collections.map((c) => ({ prefix: c.prefix, name: c.name, total: c.total, kind: c.kind, license: licenseLabel(c), attribution: c.license.attribution }))) }],
    }),
  );

  server.registerPrompt(
    "pick-icons-for-ui",
    {
      title: "Pick a consistent icon set for a UI",
      description: "Guides the agent from a component description to importable icons from one set.",
      argsSchema: { description: z.string().describe("What you are building, e.g. 'sidebar with home, projects, settings, logout'") },
    },
    ({ description }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `I am building: ${description}\n\n` +
              "1. Call detect_icon_packages with this project's dependencies.\n" +
              "2. List the icon concepts needed and call search_icons with `queries` (and `package` if one was detected).\n" +
              "3. Choose ONE set that covers all concepts (prefer the installed package; otherwise a permissive-licence set).\n" +
              "4. Call get_icons with the chosen ids and the project's framework as `format`.\n" +
              "5. Use the package import when available; otherwise the inline component. Mention any attribution requirement.",
          },
        },
      ],
    }),
  );
}
