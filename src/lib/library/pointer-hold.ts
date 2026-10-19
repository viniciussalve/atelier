/**
 * Where a pointer press stands. While it is held, layout changes it caused (a
 * pane turning active shows or hides the inspector) wait, so the release and
 * the click still land on what the person aimed at.
 */
export type Hold = "idle" | "pressed" | "dragging";

/**
 * - press: pointerdown;
 * - release: pointerup or pointercancel;
 * - dragstart: an HTML drag began;
 * - dragend: dragend, drop or the window losing focus;
 * - unpressed: a pointer move with no button down.
 */
export type HoldEvent = "press" | "release" | "dragstart" | "dragend" | "unpressed";

export function nextHold(hold: Hold, event: HoldEvent): Hold {
  switch (event) {
    case "press":
      return "pressed";
    // A drag cancels the pointer as it starts; the hold then waits for the drop.
    case "release":
      return hold === "dragging" ? hold : "idle";
    case "dragstart":
      return hold === "pressed" ? "dragging" : hold;
    // "unpressed" is the safety net for a release or drop that never arrived.
    case "dragend":
    case "unpressed":
      return "idle";
  }
}

export function isHeld(hold: Hold): boolean {
  return hold !== "idle";
}
