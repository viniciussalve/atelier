import type { Kind, View } from "./types.ts";

/**
 * The comparison selection after clicking `id`'s checkbox. Items the current
 * search or filters hide leave the selection first, so a selection the person
 * can no longer see never uses up the `max` slots.
 */
export function toggleSelection(
  current: ReadonlySet<string>,
  id: string,
  visible: ReadonlySet<string>,
  max: number,
): Set<string> {
  const next = new Set([...current].filter((item) => visible.has(item)));
  if (next.has(id)) next.delete(id);
  else if (next.size < max) next.add(id);
  return next;
}

/** A comparison selection and the library and view it was made in. */
export type Selection = { scope: string; ids: string[] };

/** The library and view a selection belongs to; another view starts a new selection. */
export function selectionScope(kind: Kind, view: View): string {
  return view.type === "folder" ? `${kind}:folder:${view.id}` : `${kind}:${view.type}`;
}

/** The saved selection, if it was made in `scope`; otherwise an empty one. */
export function selectionIn(saved: Selection | undefined, scope: string): Set<string> {
  return new Set(saved && saved.scope === scope ? saved.ids : []);
}
