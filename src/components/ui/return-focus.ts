/**
 * Gives focus back to the element that had it before an overlay opened. When that
 * element cannot take it any more (it left the page, sits under an inert region,
 * or was the page itself), focus goes to `fallback()` instead.
 */
export function returnFocus(opener: Element | null, fallback?: () => HTMLElement | null): void {
  const usable =
    opener instanceof HTMLElement &&
    opener !== opener.ownerDocument.body &&
    opener.isConnected &&
    !opener.closest("[inert]");
  (usable ? opener : fallback?.())?.focus();
}
