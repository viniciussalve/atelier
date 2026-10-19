import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREVIEW,
  PREVIEW_RANGE,
  PREVIEW_SAMPLE,
  previewText,
  sanitizePreview,
} from "./preview.ts";

describe("sanitizePreview", () => {
  it("keeps a valid preview", () => {
    assert.deepEqual(sanitizePreview("font", { text: "Olá", size: 48 }), { text: "Olá", size: 48 });
  });

  it("falls back to the kind default for anything missing or wrong", () => {
    assert.deepEqual(sanitizePreview("font", undefined), DEFAULT_PREVIEW.font);
    assert.deepEqual(sanitizePreview("icon", "lixo"), DEFAULT_PREVIEW.icon);
    assert.deepEqual(sanitizePreview("font", { text: 3, size: "x" }), DEFAULT_PREVIEW.font);
  });

  it("clamps the size to the kind range", () => {
    assert.equal(sanitizePreview("font", { text: "", size: 999 }).size, PREVIEW_RANGE.font.max);
    assert.equal(sanitizePreview("icon", { text: "", size: 1 }).size, PREVIEW_RANGE.icon.min);
  });
});

describe("previewText", () => {
  it("uses what the person typed", () => {
    assert.equal(previewText({ text: "Minha marca", size: 40 }), "Minha marca");
  });

  it("shows the sample sentence when the field is blank", () => {
    assert.equal(previewText({ text: "   ", size: 40 }), PREVIEW_SAMPLE);
  });
});
