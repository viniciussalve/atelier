import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHeld, nextHold, type Hold, type HoldEvent } from "./pointer-hold.ts";

const run = (events: HoldEvent[], from: Hold = "idle") => events.reduce(nextHold, from);

describe("pointer hold", () => {
  it("holds from the press until the release", () => {
    assert.equal(isHeld(run(["press"])), true);
    assert.equal(isHeld(run(["press", "release"])), false);
  });

  it("keeps holding through a drag, whose start cancels the pointer, until the drop", () => {
    const dragging = run(["press", "dragstart", "release"]);
    assert.equal(dragging, "dragging");
    assert.equal(isHeld(dragging), true);
    assert.equal(run(["dragend"], dragging), "idle");
  });

  it("does not hold for a drag that no press started", () => {
    assert.equal(run(["dragstart"]), "idle");
  });

  it("lets go when a move shows no button down, in case the release never arrived", () => {
    assert.equal(run(["press", "unpressed"]), "idle");
  });

  it("starts over on a new press, even mid-drag", () => {
    assert.equal(run(["press", "dragstart", "press"]), "pressed");
  });

  it("stays idle when nothing is pressed", () => {
    for (const event of ["release", "dragend", "unpressed"] as const) {
      assert.equal(nextHold("idle", event), "idle");
    }
  });
});
