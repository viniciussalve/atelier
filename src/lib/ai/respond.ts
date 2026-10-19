/** Responses of the AI-facing endpoints: JSON by default, Markdown on `?formato=md`. */
import { publicBase } from "./public-base.ts";

const SHARED = {
  // Read-only public data: any page or agent may read it.
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};

export function wantsMarkdown(request: Request): boolean {
  const format = new URL(request.url).searchParams.get("formato");
  return format === "md" || format === "markdown" || format === "texto";
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...SHARED },
  });
}

/** Plain text, so a browser shows it instead of downloading a .md file. */
export function markdown(
  body: string,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...SHARED, ...headers },
  });
}

/**
 * The public base of a request (see `publicBase`): `PUBLIC_BASE_URL` when set,
 * else the origin behind the proxies that forward it, plus the port prefix on
 * path-based previews. `linkPrefix` is `p` from the Link para IA.
 */
export function baseOf(request: Request, linkPrefix?: string | null): string {
  return publicBase({
    url: request.url,
    headers: request.headers,
    linkPrefix,
    configured: typeof process === "undefined" ? undefined : process.env.PUBLIC_BASE_URL,
  });
}

/** For cached responses whose body embeds `baseOf`: one copy per forwarded origin. */
export const VARY_BASE = { vary: "X-Forwarded-Host, X-Forwarded-Proto, X-Forwarded-Prefix" };
