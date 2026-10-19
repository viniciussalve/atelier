/**
 * The public base of the app as a request sees it: origin, plus the port prefix
 * on path-based previews. It goes into the links of /llms.txt, /robots.txt and
 * /ia, and the first two are cached publicly, so nothing the client sends is
 * taken as is: headers must be a plain host and protocol, and a prefix must be
 * exactly a preview port id on a preview host.
 */
import { previewPathPrefix } from "../preview-path-prefix.ts";

export type BaseRequest = {
  /** The request URL as the server got it. */
  url: string;
  /** Its headers: `x-forwarded-*` from a proxy, or from anyone. */
  headers: { get(name: string): string | null };
  /** `p` in the Link para IA: the port prefix the browser was under. */
  linkPrefix?: string | null;
  /** `PUBLIC_BASE_URL`, set by whoever deploys: wins over everything else. */
  configured?: string;
};

/** "host" or "host:port"; no path, user, spaces or other separators. */
const HOST =
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*|\[[0-9a-f:.]+\])(?::\d{1,5})?$/i;

/** The first value of a header a chain of proxies may have appended to. */
const first = (value: string | null | undefined) => value?.split(",")[0]?.trim() || undefined;

function originOf(proto: string, host: string): URL | undefined {
  try {
    return new URL(`${proto}://${host}`);
  } catch {
    // A port over 65535, an IPv6 literal that is not one.
    return undefined;
  }
}

function configuredBase(value: string | undefined): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return undefined;
  }
}

/** The prefix, only when it is exactly a preview port id and the host is a preview host. */
function trustedPrefix(hostname: string, value: string | null | undefined): string | undefined {
  const prefix = first(value)?.replace(/\/$/, "");
  if (!prefix) return undefined;
  return previewPathPrefix(hostname, prefix) === prefix ? prefix : undefined;
}

export function publicBase({ url, headers, linkPrefix, configured }: BaseRequest): string {
  const fixed = configuredBase(configured);
  if (fixed) return fixed;

  const own = new URL(url);
  const proto = first(headers.get("x-forwarded-proto"))?.toLowerCase();
  const host = first(headers.get("x-forwarded-host"));
  const origin =
    originOf(
      proto === "http" || proto === "https" ? proto : own.protocol.slice(0, -1),
      host && HOST.test(host) ? host : own.host,
    ) ?? own;
  const prefix =
    trustedPrefix(origin.hostname, headers.get("x-forwarded-prefix")) ??
    trustedPrefix(origin.hostname, linkPrefix);
  return `${origin.origin}${prefix ?? ""}`;
}
