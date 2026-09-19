"use client";

import { useState } from "react";
import { CopyButton } from "../CopyButton";

export type AgentGuide = {
  id: string;
  name: string;
  steps: { text: string; code?: string; file?: string }[];
};

export function AgentTabs({ agents }: { agents: AgentGuide[] }) {
  const [active, setActive] = useState(agents[0].id);
  const agent = agents.find((a) => a.id === active)!;

  return (
    <div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" style={{ scrollbarWidth: "none" }}>
        {agents.map((a) => (
          <button key={a.id} type="button" className="chip shrink-0" data-active={a.id === active} onClick={() => setActive(a.id)}>
            {a.name}
          </button>
        ))}
      </div>
      <ol className="mt-4 space-y-4">
        {agent.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-medium text-accent dark:text-[#d2e3fc]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{s.text}</p>
              {s.code && (
                <div className="mt-2">
                  {s.file && <div className="mb-1 font-mono text-[11px] text-fg-subtle">{s.file}</div>}
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-2xl border bg-bg-elevated p-4 pr-14 font-mono text-[13px] leading-relaxed">{s.code}</pre>
                    <CopyButton text={s.code} className="absolute right-2 top-2" />
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
