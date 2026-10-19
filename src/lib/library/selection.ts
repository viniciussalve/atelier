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
