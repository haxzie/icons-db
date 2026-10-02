import Link from "next/link";

export function PageHeader({
  crumbs,
  title,
  action,
  width = "max-w-[1400px]",
}: {
  crumbs?: { href: string; label: string }[];
  title: string;
  /** Sits opposite the title — a primary action for the page. */
  action?: React.ReactNode;
  width?: string;
}) {
  return (
    <div className={`mx-auto w-full ${width} px-4 pb-2 pt-6 md:px-8`}>
      {crumbs && crumbs.length > 0 && (
        <nav className="mb-1 text-sm text-fg-muted">
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span className="mx-1.5 text-fg-subtle">/</span>}
              <Link href={c.href} className="hover:text-fg">
                {c.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-medium tracking-tight">{title}</h1>
        {action}
      </div>
    </div>
  );
}
