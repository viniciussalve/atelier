/** Responses of the AI-facing endpoints: JSON by default, Markdown on `?formato=md`. */

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

/** The public origin of a request, behind the proxies that forward it. */
export function baseOf(request: Request): string {
  const url = new URL(request.url);
  const first = (value: string | null) => value?.split(",")[0]?.trim() || undefined;
  const host = first(request.headers.get("x-forwarded-host")) ?? url.host;
  const proto = first(request.headers.get("x-forwarded-proto")) ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
