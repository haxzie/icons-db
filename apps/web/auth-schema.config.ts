/**
 * Config shim for `better-auth generate` only — the real instance is built
 * per-request in src/lib/auth/config.ts, where the D1 binding exists.
 * The stub below is just enough for the CLI to pick the D1/SQLite dialect.
 */
import { createAuth } from "@/lib/auth/config";

const stub = {
  prepare: () => ({ bind: () => ({ all: async () => ({ results: [], meta: {} }) }) }),
  batch: async () => [],
  exec: async () => ({}),
};

export const auth = createAuth({
  DB: stub,
  BETTER_AUTH_SECRET: "schema-generation-only",
} as unknown as Parameters<typeof createAuth>[0]);
