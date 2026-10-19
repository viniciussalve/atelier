import { previewPathPrefix } from "../preview-path-prefix.ts";

type Where = { origin: string; hostname: string; pathname: string };

/**
 * The app's public base, without a trailing slash: the origin, plus the port
 * prefix on path-based preview hosts (the proxy strips it before the server).
 * Browser code passes `window.location`.
 */
export function appBase(where: Where): string {
  return `${where.origin}${previewPathPrefix(where.hostname, where.pathname) ?? ""}`;
}

/** An app path ("/api/fontes") resolved against the public base. */
export function appUrl(where: Where, path: string): string {
  return `${appBase(where)}${path.startsWith("/") ? path : `/${path}`}`;
}
