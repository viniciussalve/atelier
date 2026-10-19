/**
 * Stand-in for the platform's PWA dev plugin, which is not part of this
 * repository. `vite.config.ts` imports it, so without this file the dev server
 * cannot start. It does nothing: the real plugin (PWA head tags and the
 * `?install=1` page) can replace this file at the same path.
 */
export function grokPwaPlugin() {
  return { name: "grok-pwa:stub" };
}
