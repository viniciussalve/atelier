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
export function markdown(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...SHARED },
  });
}
