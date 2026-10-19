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

function showNotice(notice: string) {
  clearTimeout(timer);
  updateCopy({ notice });
  timer = setTimeout(() => updateCopy({ notice: null }), 2500);
}

/**
 * Starts the write at once, inside the click: Safari only lets a page copy
 * there. Text still being built goes in a ClipboardItem as a promise, which
 * the browser waits for.
 */
function write(text: string | Promise<string>): Promise<void> {
  if (typeof text === "string") return navigator.clipboard.writeText(text);
  if (typeof ClipboardItem === "function" && navigator.clipboard.write) {
    const blob = text.then((value) => new Blob([value], { type: "text/plain" }));
    // A browser that refuses before reading it leaves it unobserved; `text` is awaited later.
    blob.catch(() => undefined);
    return navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
  }
  return text.then((value) => navigator.clipboard.writeText(value));
}

/**
 * Copies `text`, which may still be in the making: call it right in the click,
 * not after awaiting the text. On success shows `notice` for a moment (skip it
 * when the caller shows its own feedback); when the browser refuses (an
 * embedded preview, an old browser), opens a dialog with the text selected to
 * copy by hand; when the text could not be made, says so. Never rejects.
 */
export async function copyText(
  text: string | Promise<string>,
  { notice, title }: { notice?: string; title: string },
): Promise<boolean> {
  try {
    await write(text);
    if (notice) showNotice(notice);
    return true;
  } catch {
    try {
      updateCopy({ fallback: { title, text: await text } });
    } catch {
      showNotice("Não deu para copiar. Tente de novo.");
    }
    return false;
  }
}

export function copyState(): CopyState {
  return state;
}
