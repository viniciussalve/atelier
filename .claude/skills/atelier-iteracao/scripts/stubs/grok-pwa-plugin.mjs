/**
 * Stand-in for the platform's PWA dev plugin (`scripts/grok-pwa-plugin.mjs`),
 * which is not part of this repository. `vite.config.ts` imports it, so without
 * it the dev server cannot start outside the platform. `setup.sh` copies this
 * file there when it is missing, outside git. It does nothing.
 */
export function grokPwaPlugin() {
  return { name: "grok-pwa:stub" };
}
