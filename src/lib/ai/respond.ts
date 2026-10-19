/** Responses of the AI-facing endpoints: JSON by default, Markdown on `?formato=md`. */

/**
 * How long a successful answer may be reused:
 * - "public": bundled catalog data, which only a deploy changes; anyone may keep it.
 * - "private": a live lookup (Iconify's search); only the client keeps it, briefly,
 *   so a shared cache never hands one moment's answer to everyone.
 * - "none": an answer a retry must check again (a family Google did not confirm).
 */
export type Caching = "public" | "private" | "none";

/** Errors are never kept: the next try has to reach the server. */
export function cacheControl(status: number, caching: Caching = "public"): string {
  if (status >= 400 || caching === "none") return "no-store";
  return caching === "private" ? "private, max-age=60" : "public, max-age=300";
}

function headers(contentType: string, status: number, caching: Caching) {
  return {
    "content-type": contentType,
    // Read-only public data: any page or agent may read it.
    "access-control-allow-origin": "*",
    "cache-control": cacheControl(status, caching),
  };
}

export function wantsMarkdown(request: Request): boolean {
  const format = new URL(request.url).searchParams.get("formato");
  return format === "md" || format === "markdown" || format === "texto";
}

export function json(body: unknown, status = 200, caching: Caching = "public"): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: headers("application/json; charset=utf-8", status, caching),
  });
}

/** Plain text, so a browser shows it instead of downloading a .md file. */
export function markdown(body: string, status = 200, caching: Caching = "public"): Response {
  return new Response(body, {
    status,
    headers: headers("text/plain; charset=utf-8", status, caching),
  });
}
