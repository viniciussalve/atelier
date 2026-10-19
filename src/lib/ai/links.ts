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

/**
 * The "Link para IA" for an encoded snapshot. On a path-based preview it also
 * carries the port prefix in `p`: the proxy strips it, so /ia could not know it
 * to write its own links.
 */
export function aiLinkUrl(where: Where, encoded: string): string {
  const prefix = previewPathPrefix(where.hostname, where.pathname);
  return appUrl(where, `/ia?b=${encoded}${prefix ? `&p=${prefix}` : ""}`);
}
