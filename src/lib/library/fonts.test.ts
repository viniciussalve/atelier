import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { googleFontsHref, parseWeights, primaryFamily, weightName } from "./fonts.ts";
import { seedAssets } from "./seed.ts";

describe("parseWeights", () => {
  it("expands ranges in steps of 100, whatever the dash", () => {
    assert.deepEqual(parseWeights("400–600"), [400, 500, 600]);
    assert.deepEqual(parseWeights("400-700"), [400, 500, 600, 700]);
    assert.deepEqual(parseWeights("500—600"), [500, 600]);
  });

  it("reads lists and single weights", () => {
    assert.deepEqual(parseWeights("400, 700"), [400, 700]);
    assert.deepEqual(parseWeights("500"), [500]);
  });

  it("falls back to regular", () => {
    assert.deepEqual(parseWeights(""), [400]);
    assert.deepEqual(parseWeights("variável"), [400]);
  });
});

describe("weightName", () => {
  it("names common weights in Portuguese", () => {
    assert.equal(weightName(400), "Regular");
    assert.equal(weightName(600), "Seminegrito");
    assert.equal(weightName(450), "450");
  });
});

describe("primaryFamily", () => {
  it("takes the first family of a CSS stack, unquoted", () => {
    assert.equal(primaryFamily('"IBM Plex Sans", sans-serif'), "IBM Plex Sans");
    assert.equal(primaryFamily("Inter, sans-serif"), "Inter");
  });
});

describe("googleFontsHref", () => {
  it("loads every weight each seed font declares, plus the UI fonts", () => {
    assert.equal(
      googleFontsHref(seedAssets),
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans:wght@400;500;600&family=Playfair+Display:wght@500;600&family=Roboto:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap",
    );
  });
});
