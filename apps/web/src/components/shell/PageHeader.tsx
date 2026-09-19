import Link from "next/link";

export function PageHeader({ crumbs, title }: { crumbs?: { href: string; label: string }[]; title: string }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-2 pt-6 md:px-8">
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
      <h1 className="text-[28px] font-medium tracking-tight">{title}</h1>
    </div>
  );
}
