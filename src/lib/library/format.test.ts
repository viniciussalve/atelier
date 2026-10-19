import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate } from "./format.ts";

describe("formatDate", () => {
  it("prints local date and time", () => {
    const iso = new Date(2026, 9, 19, 14, 5).toISOString();
    assert.equal(formatDate(iso), "2026/10/19 14:05");
  });

  it("prints a dash for an invalid date", () => {
    assert.equal(formatDate("ontem"), "—");
  });
});
