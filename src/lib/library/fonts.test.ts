import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fontAssetHref,
  googleFontHref,
  googleFontsHref,
  parseWeights,
  primaryFamily,
  weightName,
  weightRoles,
} from "./fonts.ts";
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

describe("googleFontHref", () => {
  it("asks for one family with its weights", () => {
    assert.equal(
      googleFontHref("Inter Tight", [700, 400]),
      "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&display=swap",
    );
  });

  it("asks for the default cut when the weights are unknown", () => {
    assert.equal(
      googleFontHref("M PLUS 1p", []),
      "https://fonts.googleapis.com/css2?family=M+PLUS+1p&display=swap",
    );
  });
});

describe("fontAssetHref", () => {
  it("reads the first family and the declared weights", () => {
    assert.equal(
      fontAssetHref({ family: '"Space Mono", monospace', weights: "400, 700" }),
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
    );
    assert.equal(
      fontAssetHref({ family: '"Brand New", sans-serif', weights: "" }),
      "https://fonts.googleapis.com/css2?family=Brand+New&display=swap",
    );
  });
});

describe("weightRoles", () => {
  it("gives text, labels and titles the declared weights closest to 400, 500 and 600", () => {
    assert.deepEqual(weightRoles([100, 200, 300, 400, 500, 600, 700, 800, 900]), {
      texto: 400,
      rotulo: 500,
      titulo: 600,
    });
    assert.deepEqual(weightRoles([400, 700]), { texto: 400, rotulo: 400, titulo: 700 });
    assert.deepEqual(weightRoles([300, 500]), { texto: 300, rotulo: 500, titulo: 500 });
  });

  it("falls back to the one weight a font has", () => {
    assert.deepEqual(weightRoles([400]), { texto: 400, rotulo: 400, titulo: 400 });
    assert.deepEqual(weightRoles([]), { texto: 400, rotulo: 400, titulo: 400 });
  });
});
