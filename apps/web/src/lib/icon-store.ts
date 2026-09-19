"use client";

import { useSyncExternalStore } from "react";
import type { IconifyIcon } from "@iconify/types";

type Entry = IconifyIcon | null;

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const pending = new Map<string, Set<string>>();
let scheduled = false;

function emit() {
  for (const l of listeners) l();
}

async function flush() {
  scheduled = false;
  const batches = Array.from(pending.entries());
  pending.clear();
  await Promise.all(
    batches.map(async ([prefix, names]) => {
      const list = Array.from(names);
      for (let i = 0; i < list.length; i += 150) {
        const chunk = list.slice(i, i + 150);
        try {
          const res = await fetch(`/api/v1/icons/${prefix}?icons=${chunk.join(",")}`);
          const data = (await res.json()) as { icons: Record<string, IconifyIcon> };
          for (const n of chunk) cache.set(`${prefix}:${n}`, data.icons[n] ?? null);
        } catch {
          for (const n of chunk) cache.set(`${prefix}:${n}`, null);
        }
        emit();
      }
    }),
  );
}

export function requestIcon(prefix: string, name: string) {
  const id = `${prefix}:${name}`;
  if (cache.has(id)) return;
  cache.set(id, undefined as unknown as Entry); // mark in-flight
  let set = pending.get(prefix);
  if (!set) pending.set(prefix, (set = new Set()));
  set.add(name);
  if (!scheduled) {
    scheduled = true;
    setTimeout(flush, 12);
  }
}

export function primeIcon(prefix: string, name: string, icon: IconifyIcon) {
  cache.set(`${prefix}:${name}`, icon);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useIcon(prefix: string, name: string): IconifyIcon | null | undefined {
  const id = `${prefix}:${name}`;
  const value = useSyncExternalStore(
    subscribe,
    () => cache.get(id),
    () => undefined,
  );
  if (value === undefined && typeof window !== "undefined") requestIcon(prefix, name);
  return value;
}
