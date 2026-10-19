import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cacheControl, json, markdown } from "./respond.ts";

describe("cacheControl", () => {
  it("lets anyone keep catalog answers for five minutes", () => {
    assert.equal(cacheControl(200, "public"), "public, max-age=300");
    assert.equal(cacheControl(200), "public, max-age=300");
  });

  it("keeps live lookups only in the client, for a minute", () => {
    assert.equal(cacheControl(200, "private"), "private, max-age=60");
  });

  it("never keeps errors or answers a retry must check again", () => {
    assert.equal(cacheControl(400, "public"), "no-store");
    assert.equal(cacheControl(502, "private"), "no-store");
    assert.equal(cacheControl(200, "none"), "no-store");
  });
});

describe("json and markdown", () => {
  it("send the cache header that fits the status", () => {
    const error = json({ erro: "Passe o nome do ícone em ?q=." }, 400);
    assert.equal(error.status, 400);
    assert.equal(error.headers.get("cache-control"), "no-store");
    assert.equal(error.headers.get("access-control-allow-origin"), "*");
    assert.equal(json({}, 200, "none").headers.get("cache-control"), "no-store");
    assert.equal(markdown("# Fontes\n").headers.get("cache-control"), "public, max-age=300");
    assert.equal(
      markdown("# Ícones\n", 200, "private").headers.get("cache-control"),
      "private, max-age=60",
    );
  });
});
