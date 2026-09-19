"use client";
// Main-thread handle to the embedding worker (see semantic-worker.ts).
// Runs semantic search locally instead of round-tripping to /api/v1/search.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SemanticHit } from "@icons-db/core";
import type { WorkerRequest, WorkerResponse } from "./semantic-types";

const MODEL = "Xenova/bge-small-en-v1.5";

export type SemanticStatus =
  | { state: "loading"; progress: number }
  | { state: "ready" }
  | { state: "error"; message: string };

export class LocalSemanticSearch {
  private worker: Worker;
  private nextId = 0;
  private pending = new Map<number, (r: { hits: SemanticHit[]; ms: number }) => void>();
  private _status: SemanticStatus = { state: "loading", progress: 0 };
  onStatus: (s: SemanticStatus) => void = () => {};

  constructor() {
    this.worker = new Worker(new URL("./semantic-worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "status") {
        this._status =
          msg.state === "loading"
            ? { state: "loading", progress: msg.progress }
            : msg.state === "ready"
              ? { state: "ready" }
              : { state: "error", message: msg.message };
        this.onStatus(this._status);
      } else {
        this.pending.get(msg.id)?.({ hits: msg.hits, ms: msg.ms });
        this.pending.delete(msg.id);
      }
    };
    this.worker.onerror = (e) => {
      this._status = { state: "error", message: e.message };
      this.onStatus(this._status);
    };
    this.send({ type: "init", dataUrl: "/data/search-index.json", embeddingsUrl: "/data/embeddings.bin", model: MODEL });
  }

  get status() {
    return this._status;
  }

  get ready() {
    return this._status.state === "ready";
  }

  search(query: string, limit: number): Promise<{ hits: SemanticHit[]; ms: number }> {
    return new Promise((resolve) => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      this.send({ type: "search", id, query, limit });
    });
  }

  destroy() {
    this.worker.terminate();
  }

  private send(msg: WorkerRequest) {
    this.worker.postMessage(msg);
  }
}

/** Lazily spins up the worker on mount, tears it down on unmount. */
export function useLocalSemanticSearch() {
  const ref = useRef<LocalSemanticSearch | null>(null);
  const [status, setStatus] = useState<SemanticStatus>({ state: "loading", progress: 0 });

  useEffect(() => {
    const client = new LocalSemanticSearch();
    client.onStatus = setStatus;
    ref.current = client;
    return () => {
      client.destroy();
      ref.current = null;
    };
  }, []);

  const search = useCallback(
    (query: string, limit: number) => ref.current?.search(query, limit) ?? null,
    [],
  );

  // Stable identity: SearchApp depends on this whole in an effect, and a
  // fresh object every render would re-fire that effect on every keystroke.
  return useMemo(() => ({ status, search }), [status, search]);
}
