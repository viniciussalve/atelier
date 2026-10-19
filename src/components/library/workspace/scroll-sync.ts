/**
 * Keeps specimen scroll positions in step across panes when "Rolagem" sync is
 * on. Positions are shared as a ratio of the scrollable height, so specimens
 * of different lengths line up by section rather than by pixel.
 *
 * Only the pane the pointer is in drives: the scroll events its writes cause
 * in other panes are recorded but never fanned out again, so there is no loop.
 */
import { useWorkspace } from "@/lib/library/workspace";

type Scroller = { el: HTMLElement; key: string };

const scrollers = new Map<string, Scroller>();
/** Last ratio per pane and tab, to restore after a remount. */
const ratios = new Map<string, number>();
let driver: string | null = null;
let frame = 0;

const ratioOf = (el: HTMLElement) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
const applyRatio = (el: HTMLElement, ratio: number) => {
  el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
};

/** Registers a pane's specimen scroller; `key` names what it shows (item and tab). */
export function registerScroller(paneId: string, key: string, el: HTMLElement) {
  scrollers.set(paneId, { el, key });
  // A new item or tab starts at the top unless it was scrolled before.
  const saved = ratios.get(`${paneId}|${key}`) ?? 0;
  requestAnimationFrame(() => applyRatio(el, saved));
  return () => {
    if (scrollers.get(paneId)?.el === el) scrollers.delete(paneId);
  };
}

export function claimScroll(paneId: string) {
  driver = paneId;
}

export function handleScroll(paneId: string) {
  const own = scrollers.get(paneId);
  if (!own) return;
  ratios.set(`${paneId}|${own.key}`, ratioOf(own.el));
  if (driver !== paneId || !useWorkspace.getState().sync.scroll) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const ratio = ratioOf(own.el);
    for (const [id, other] of scrollers) if (id !== paneId) applyRatio(other.el, ratio);
  });
}

function alignTo(paneId: string) {
  const own = scrollers.get(paneId);
  if (!own) return;
  const ratio = ratioOf(own.el);
  for (const [id, other] of scrollers) if (id !== paneId) applyRatio(other.el, ratio);
}

if (typeof window !== "undefined") {
  useWorkspace.subscribe((state, previous) => {
    if (state.sync.scroll && !previous.sync.scroll) alignTo(state.activePaneId);
  });
}
