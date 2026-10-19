type Fallback = { title: string; text: string };
export type CopyState = { notice: string | null; fallback: Fallback | null };

let state: CopyState = { notice: null, fallback: null };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

export function updateCopy(patch: Partial<CopyState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeCopy(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while the copy-by-hand dialog is open: global shortcuts stay out of it. */
export function copyDialogOpen() {
  return state.fallback !== null;
}

/**
 * Copies `text`. On success shows `notice` for a moment (skip it when the caller
 * shows its own feedback); when the browser refuses (an embedded preview, an
 * old browser), opens a dialog with the text selected to copy by hand.
 */
export async function copyText(
  text: string,
  { notice, title }: { notice?: string; title: string },
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (notice) {
      clearTimeout(timer);
      updateCopy({ notice });
      timer = setTimeout(() => updateCopy({ notice: null }), 2500);
    }
    return true;
  } catch {
    updateCopy({ fallback: { title, text } });
    return false;
  }
}

export function copyState(): CopyState {
  return state;
}
