import type { SemanticHit } from "@icons-db/core";

export type WorkerRequest =
  // The index bytes arrive as a separate `data` message so `init` can start
  // the ~30 MB model download the moment the worker boots instead of queueing
  // behind the index download.
  | { type: "init"; embeddingsUrl: string; model: string }
  | { type: "data"; buffer: ArrayBuffer }
  | { type: "search"; id: number; query: string; limit: number };

export type WorkerResponse =
  | { type: "status"; state: "loading"; progress: number }
  | { type: "status"; state: "ready" }
  | { type: "status"; state: "error"; message: string }
  | { type: "result"; id: number; hits: SemanticHit[]; ms: number };
