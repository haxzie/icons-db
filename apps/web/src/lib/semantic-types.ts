import type { SemanticHit } from "@icons-db/core";

export type WorkerRequest =
  | { type: "init"; dataUrl: string; embeddingsUrl: string; model: string }
  | { type: "search"; id: number; query: string; limit: number };

export type WorkerResponse =
  | { type: "status"; state: "loading"; progress: number }
  | { type: "status"; state: "ready" }
  | { type: "status"; state: "error"; message: string }
  | { type: "result"; id: number; hits: SemanticHit[]; ms: number };
