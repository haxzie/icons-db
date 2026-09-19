"use client";

import { useState } from "react";

export function FilterSidebar({
  open,
  onClose,
  onReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {open && <button type="button" aria-label="Close filters" onClick={onClose} className="fixed inset-0 z-30 bg-black/30 md:hidden" />}
      <aside
        className={`scrollbar-thin fixed inset-y-0 left-0 z-40 w-[320px] overflow-y-auto border-r bg-bg-elevated transition-transform md:sticky md:top-0 md:z-0 md:h-screen md:shrink-0 md:transition-[width,transform] ${
          open ? "translate-x-0" : "-translate-x-full md:w-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        <div className="w-[320px] px-5 pb-10 pt-4">
          <div className="mb-2 flex h-10 items-center justify-end gap-1">
            <button type="button" onClick={onReset} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset all
            </button>
            <button type="button" onClick={onClose} aria-label="Close filters" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-bg-muted hover:text-fg">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </aside>
    </>
  );
}

export function SidebarSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-[15px] font-medium hover:bg-bg-muted"
      >
        {icon && <span className="grid size-6 place-items-center text-fg-muted">{icon}</span>}
        <span className="flex-1">{title}</span>
        <svg viewBox="0 0 24 24" className={`size-4 text-fg-muted transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-1 pt-2">{children}</div>}
    </section>
  );
}

export function SidebarLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[15px] font-medium">{children}</h2>;
}
