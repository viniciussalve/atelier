import { register } from "node:module";

/** AC-03: preload only TS test workers; no deprecated --loader flag or global mutation. */
register("./test-loader.mjs", import.meta.url);
