import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository root. */
export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../..");
