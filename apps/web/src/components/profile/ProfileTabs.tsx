"use client";

import { useRef, useState } from "react";
import type { AppGrant } from "@/lib/auth/grants";
import type { ApiToken } from "@/lib/auth/tokens";
import { ConnectedApps } from "./ConnectedApps";
import { TokenManager } from "./TokenManager";

const TABS = [
  { id: "apps", label: "Connected apps" },
  { id: "tokens", label: "Personal access tokens" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Sized and weighted to sit inside .chip alongside the label.
const ICONS: Record<TabId, React.ReactNode> = {
  apps: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  tokens: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.8 12.2 8.2-8.2" />
      <path d="m17 6 2.5 2.5" />
      <path d="m14 9 2.5 2.5" />
    </svg>
  ),
};

const BLURB: Record<TabId, string> = {
  apps: "Apps you authorized to use the IconsDB MCP server on your behalf.",
  tokens: "For MCP clients and scripts that can't do the browser sign-in.",
};

/**
 * Tabs rather than stacked sections: either list can grow without burying the
 * other below the fold.
 */
export function ProfileTabs({ grants, tokens }: { grants: AppGrant[]; tokens: ApiToken[] }) {
  const [active, setActive] = useState<TabId>("apps");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const counts: Record<TabId, number> = { apps: grants.length, tokens: tokens.length };

  // Arrow keys move between tabs, as a tablist is expected to.
  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const index = TABS.findIndex((t) => t.id === active);
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div className="mt-10">
      <div role="tablist" aria-label="Account settings" onKeyDown={onKeyDown} className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            data-active={active === tab.id}
            onClick={() => setActive(tab.id)}
            className="chip shrink-0"
          >
            {ICONS[tab.id]}
            {tab.label}
            {counts[tab.id] > 0 && <span className="text-fg-muted">{counts[tab.id]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="mt-5">
        <p className="text-sm text-fg-muted">
          {BLURB[active]}
          {active === "tokens" && (
            <>
              {" "}
              Send one as <code className="font-mono text-xs">Authorization: Bearer …</code>.
            </>
          )}
        </p>
        {active === "apps" ? <ConnectedApps grants={grants} /> : <TokenManager tokens={tokens} />}
      </div>
    </div>
  );
}
