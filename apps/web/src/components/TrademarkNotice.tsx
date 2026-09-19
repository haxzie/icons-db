export function TrademarkNotice({ className = "", compact }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <p className={`text-xs leading-relaxed text-fg-muted ${className}`}>
        Brand logos are trademarks of their respective owners. The license covers the SVG file, not the right to use the mark — follow each
        brand&apos;s guidelines.
      </p>
    );
  }
  return (
    <section className={`rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 ${className}`}>
      <h2 className="font-medium">Trademarks</h2>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">
        Brand and product logos (Simple Icons, SVG Logos, Devicon, Font Awesome Brands, Boxicons Logos, Skill Icons and similar sets) are
        trademarks of their respective owners. The set licenses cover the SVG artwork only and grant no trademark rights; IconsDB is not
        affiliated with or endorsed by any of these brands. Use logos to identify a brand and follow that brand&apos;s own usage guidelines.
      </p>
    </section>
  );
}
