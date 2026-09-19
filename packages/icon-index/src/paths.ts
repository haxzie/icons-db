import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DIST = join(here, "..", "dist");
export const MODEL_CACHE = join(here, "..", ".model-cache");
