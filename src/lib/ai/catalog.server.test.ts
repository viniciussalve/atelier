import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddSpec } from "./additions.ts";
import { googleServes, resolveAdditions, searchIcons } from "./catalog.server.ts";

type Fetch = typeof fetch;

/** A fetch answered by `answer`; records each URL asked and how many were in flight at once. */
function fakeFetch(answer: (url: URL) => Response | Promise<Response>) {
  const seen = { urls: [] as URL[], maxInFlight: 0 };
  let inFlight = 0;
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    seen.urls.push(url);
    inFlight += 1;
    seen.maxInFlight = Math.max(seen.maxInFlight, inFlight);
    try {
      return await answer(url);
    } finally {
      inFlight -= 1;
    }
  }) as Fetch;
  return { fetchImpl, seen };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const font = (key: string): AddSpec => ({ kind: "font", key });

describe("googleServes", () => {
  it("asks for the family as the stylesheet links do", async () => {
    const { fetchImpl, seen } = fakeFetch(() => new Response("", { status: 200 }));
    assert.equal(await googleServes("Inter Tight", fetchImpl), true);
    assert.equal(
      seen.urls[0].href,
      "https://fonts.googleapis.com/css2?family=Inter+Tight&display=swap",
    );
  });

  it("says no when Google answers 400 or cannot be reached", async () => {
    const refused = fakeFetch(() => new Response("", { status: 400 }));
    assert.equal(await googleServes("Nada", refused.fetchImpl), false);
    const offline = (async () => {
      throw new TypeError("fetch failed");
    }) as Fetch;
    assert.equal(await googleServes("Nada", offline), false);
  });
});

describe("resolveAdditions", () => {
  it("checks the unknown families all at once and keeps the order of the list", async () => {
    // The first family answers last, so the order they finish in is not the list's.
    const delay: Record<string, number> = {
      "Fonte A Inventada": 30,
      "Fonte B Inventada": 20,
      "Fonte C Inventada": 10,
    };
    const { fetchImpl, seen } = fakeFetch(async (url) => {
      const family = url.searchParams.get("family") ?? "";
      await wait(delay[family] ?? 0);
      return new Response("", { status: family === "Fonte B Inventada" ? 400 : 200 });
    });
    const specs: AddSpec[] = [
      font("Fonte A Inventada"),
      font("Inter"),
      font("Fonte B Inventada"),
      { kind: "icon", key: "nao-existe" },
      font("Fonte C Inventada"),
    ];
    const { assets, missing } = await resolveAdditions(
      specs,
      "2026-10-19T00:00:00.000Z",
      fetchImpl,
    );
    assert.equal(seen.urls.length, 3, "only the families the catalog lacks are checked");
    assert.equal(seen.maxInFlight, 3);
    assert.deepEqual(
      assets.map((item) => item.name),
      ["Inter", "Fonte A Inventada", "Fonte C Inventada"],
    );
    assert.deepEqual(missing, [font("Fonte B Inventada"), { kind: "icon", key: "nao-existe" }]);
  });
});

describe("searchIcons", () => {
  const names = (count: number) => Array.from({ length: count }, (_, i) => `lucide:icone-${i}`);

  it("asks Iconify for at least 32 but returns only as many as asked", async () => {
    const { fetchImpl, seen } = fakeFetch(() => Response.json({ icons: names(32) }));
    const { icons, ok } = await searchIcons("home", { limit: 5 }, fetchImpl);
    assert.equal(ok, true);
    assert.deepEqual(icons, names(5));
    assert.equal(seen.urls[0].searchParams.get("query"), "home");
    assert.equal(seen.urls[0].searchParams.get("limit"), "32");
  });

  it("passes the chosen sets and keeps the limit between 1 and 999", async () => {
    const { fetchImpl, seen } = fakeFetch(() => Response.json({ icons: names(70) }));
    const chosen = await searchIcons("home", { prefixes: ["lucide", "tabler"] }, fetchImpl);
    assert.equal(chosen.icons.length, 64);
    assert.equal(seen.urls[0].searchParams.get("prefixes"), "lucide,tabler");
    assert.equal(seen.urls[0].searchParams.get("limit"), "64");
    await searchIcons("home", { limit: 5000 }, fetchImpl);
    assert.equal(seen.urls[1].searchParams.get("limit"), "999");
    assert.equal((await searchIcons("home", { limit: 0 }, fetchImpl)).icons.length, 1);
    assert.equal((await searchIcons("home", { limit: Number.NaN }, fetchImpl)).icons.length, 64);
    assert.equal(seen.urls[3].searchParams.get("limit"), "64");
  });

  it("keeps only names and reports a failed search", async () => {
    const mixed = fakeFetch(() => Response.json({ icons: ["mdi:home", 3, null] }));
    assert.deepEqual(await searchIcons("home", {}, mixed.fetchImpl), {
      icons: ["mdi:home"],
      ok: true,
    });
    const down = fakeFetch(() => new Response("", { status: 500 }));
    assert.deepEqual(await searchIcons("home", {}, down.fetchImpl), { icons: [], ok: false });
  });
});
