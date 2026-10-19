/**
 * Workspace keyboard shortcuts. Keys are matched by `code` (physical position)
 * where a modifier changes the character, e.g. ⌥2 types "™" on a Mac.
 * ⌘W and ⌘1–8 belong to the browser, so tabs close with Alt+W and panes
 * take Alt+1–6.
 */

export type ShortcutEvent = {
  key: string;
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

export type Command =
  | { type: "quickOpen" }
  | { type: "splitRight" }
  | { type: "splitDown" }
  | { type: "closeTab" }
  | { type: "focusPane"; index: number }
  | { type: "prev" }
  | { type: "next" };

export function matchShortcut(event: ShortcutEvent, isMac: boolean): Command | null {
  const mod = isMac ? event.metaKey : event.ctrlKey;
  const otherMod = isMac ? event.ctrlKey : event.metaKey;
  if (otherMod) return null;

  if (mod && !event.altKey) {
    if (!event.shiftKey && (event.code === "KeyK" || event.key.toLowerCase() === "k"))
      return { type: "quickOpen" };
    // By character: the \ key sits on Backslash in US layouts but on
    // IntlBackslash in ISO ones like ABNT2, where Backslash types ].
    if (event.key === "\\" || event.key === "|") {
      return { type: event.shiftKey ? "splitDown" : "splitRight" };
    }
    return null;
  }

  if (event.altKey && !mod && !event.shiftKey) {
    if (event.code === "KeyW") return { type: "closeTab" };
    const digit = /^Digit([1-6])$/.exec(event.code);
    if (digit) return { type: "focusPane", index: Number(digit[1]) - 1 };
    return null;
  }

  if (!mod && !event.altKey && !event.shiftKey) {
    if (event.key === "ArrowLeft") return { type: "prev" };
    if (event.key === "ArrowRight") return { type: "next" };
  }
  return null;
}

const LABELS: Record<Exclude<Command["type"], "focusPane">, { mac: string; other: string }> = {
  quickOpen: { mac: "⌘K", other: "Ctrl+K" },
  splitRight: { mac: "⌘\\", other: "Ctrl+\\" },
  splitDown: { mac: "⇧⌘\\", other: "Ctrl+Shift+\\" },
  closeTab: { mac: "⌥W", other: "Alt+W" },
  prev: { mac: "←", other: "←" },
  next: { mac: "→", other: "→" },
};

export function shortcutLabel(type: Command["type"], isMac: boolean, paneIndex = 0): string {
  if (type === "focusPane") return isMac ? `⌥${paneIndex + 1}` : `Alt+${paneIndex + 1}`;
  return isMac ? LABELS[type].mac : LABELS[type].other;
}
