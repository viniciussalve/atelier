import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { externalLink, formatDate } from "./format.ts";

describe("formatDate", () => {
  it("prints local date and time", () => {
    const iso = new Date(2026, 9, 19, 14, 5).toISOString();
    assert.equal(formatDate(iso), "2026/10/19 14:05");
  });

  it("prints a dash for an invalid date", () => {
    assert.equal(formatDate("ontem"), "—");
  });
});

describe("externalLink", () => {
  it("keeps http and https addresses", () => {
    assert.equal(
      externalLink("https://icon-sets.iconify.design/lucide/"),
      "https://icon-sets.iconify.design/lucide/",
    );
    assert.equal(externalLink("http://example.com"), "http://example.com");
  });

  it("drops what a browser would read as a path in the app or as a script", () => {
    assert.equal(externalLink("iconify.design/lucide"), null);
    assert.equal(externalLink("javascript:alert(1)"), null);
    assert.equal(externalLink(""), null);
  });
});
