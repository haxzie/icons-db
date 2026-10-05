"use client";

import { useSyncExternalStore } from "react";
import type { IconifyIcon } from "@iconify/types";
import type { RasterRef } from "@icons-db/core";

/** Raster sets have no body, so the store carries a pointer to the PNG instead. */
type Entry = IconifyIcon | RasterRef | null;

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const pending = new Map<string, Set<string>>();
let scheduled = false;

function emit() {
  for (const l of listeners) l();
}

async function flush() {
  scheduled = false;
  const ids = Array.from(pending.entries()).flatMap(([prefix, names]) => Array.from(names, (n) => `${prefix}:${n}`));
  pending.clear();
  // One request per 200 icons regardless of how many sets they span.
  await Promise.all(
    Array.from({ length: Math.ceil(ids.length / 200) }, (_, i) => ids.slice(i * 200, i * 200 + 200)).map(async (chunk) => {
      try {
        const res = await fetch(`/api/v1/icons?ids=${chunk.join(",")}`);
        const data = (await res.json()) as { icons: Record<string, IconifyIcon | RasterRef> };
        for (const id of chunk) cache.set(id, data.icons[id] ?? null);
      } catch {
        for (const id of chunk) cache.set(id, null);
      }
      emit();
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

export function primeIcon(prefix: string, name: string, icon: IconifyIcon | RasterRef) {
  cache.set(`${prefix}:${name}`, icon);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useIcon(prefix: string, name: string): Entry | undefined {
  const id = `${prefix}:${name}`;
  const value = useSyncExternalStore(
    subscribe,
    () => cache.get(id),
    () => undefined,
  );
  if (value === undefined && typeof window !== "undefined") requestIcon(prefix, name);
  return value;
}
