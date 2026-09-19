// Vendors the quantised sentence encoder into public/models so the browser
// never depends on huggingface.co at runtime — same reasoning as
// packages/icon-index (self-host what you embed with). Skips files already
// present, so re-runs are cheap.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

// Must match apps/web/src/lib/semantic-client.ts and packages/icon-index/src/embed.ts.
const MODEL = "Xenova/bge-small-en-v1.5";

// dtype 'q8' in the worker pipeline() call resolves to onnx/model_quantized.onnx.
const FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "onnx/model_quantized.onnx"];

for (const file of FILES) {
  const dest = path.join(root, "public", "models", MODEL, file);
  if (existsSync(dest)) continue;
  const url = `https://huggingface.co/${MODEL}/resolve/main/${file}`;
  process.stdout.write(`fetching ${file}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  console.log(`${(buf.byteLength / 1024 / 1024).toFixed(1)} MB`);
}
console.log(`model ready in public/models/${MODEL}`);
