import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aiLinkUrl, appBase, appUrl } from "./links.ts";

const at = (href: string) => {
  const url = new URL(href);
  return { origin: url.origin, hostname: url.hostname, pathname: url.pathname };
};

describe("appBase and appUrl", () => {
  it("is the origin on a normal host", () => {
    assert.equal(appBase(at("https://atelier.app/qualquer")), "https://atelier.app");
    assert.equal(
      appUrl(at("https://atelier.app/"), "/api/fontes"),
      "https://atelier.app/api/fontes",
    );
  });

  it("keeps the port prefix on path-based previews", () => {
    const where = at("https://preview.grok.mil/hds-a1-8080-b2/");
    assert.equal(appBase(where), "https://preview.grok.mil/hds-a1-8080-b2");
    assert.equal(appUrl(where, "api/fontes"), "https://preview.grok.mil/hds-a1-8080-b2/api/fontes");
  });
});

describe("aiLinkUrl", () => {
  it("is /ia with the snapshot on a normal host", () => {
    assert.equal(aiLinkUrl(at("https://atelier.app/"), "abc_-"), "https://atelier.app/ia?b=abc_-");
  });

  it("tells /ia the port prefix, which the proxy strips before the server", () => {
    assert.equal(
      aiLinkUrl(at("https://preview.grok.mil/hds-a1-8080-b2/"), "~abc"),
      "https://preview.grok.mil/hds-a1-8080-b2/ia?b=~abc&p=/hds-a1-8080-b2",
    );
  });
});
