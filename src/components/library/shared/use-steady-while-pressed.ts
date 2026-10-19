import { useEffect, useState } from "react";
import { isHeld, nextHold, type Hold, type HoldEvent } from "@/lib/library/pointer-hold";

const EVENTS: [string, HoldEvent][] = [
  ["pointerdown", "press"],
  ["pointerup", "release"],
  ["pointercancel", "release"],
  ["dragstart", "dragstart"],
  ["dragend", "dragend"],
  ["drop", "dragend"],
  ["blur", "dragend"],
];

/** Whether a pointer press, or the drag it started, is under way anywhere in the window. */
function usePointerHeld(enabled: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let hold: Hold = "idle";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = (event: HoldEvent) => {
      const next = nextHold(hold, event);
      if (next === hold) return;
      hold = next;
      clearTimeout(timer);
      if (isHeld(hold)) setHeld(true);
      // The click follows the release in the same task: let it land before the layout moves.
      else timer = setTimeout(() => setHeld(false), 0);
    };
    const listeners = EVENTS.map(([type, event]) => [type, () => apply(event)] as const);
    const move = (event: PointerEvent) => {
      if (event.buttons === 0) apply("unpressed");
    };
    for (const [type, listener] of listeners) window.addEventListener(type, listener, true);
    window.addEventListener("pointermove", move, true);
    return () => {
      clearTimeout(timer);
      for (const [type, listener] of listeners) window.removeEventListener(type, listener, true);
      window.removeEventListener("pointermove", move, true);
    };
  }, [enabled]);
  return held && enabled;
}

/**
 * `value` as it was when the press began, until its click (or drop) is over.
 * A press can change what the layout depends on, and moving the target before
 * the release loses the click; held back, the layout follows right after it.
 */
export function useSteadyWhilePressed<T>(value: T, enabled = true): T {
  const held = usePointerHeld(enabled);
  const [steady, setSteady] = useState(value);
  // Track the latest value while nothing is pressed (derived state, set during render).
  if (!held && steady !== value) setSteady(value);
  return held ? steady : value;
}
