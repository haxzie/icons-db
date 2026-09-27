import { Rail } from "./Rail";

/**
 * The browsing chrome: side rail plus the page column beside it.
 *
 * Applied per top-level section rather than from the root layout, because the
 * auth pages under (auth) must render without it. It deliberately isn't an
 * (app) route group: a group changes the generated route name for
 * `opengraph-image.tsx`, which would break the OG image URLs that page metadata
 * hardcodes. A new top-level section needs its own `layout.tsx` re-exporting
 * this — see blog/layout.tsx.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Rail />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
    </>
  );
}
