/**
 * Whether a closing panel should hand focus back to its trigger.
 *
 * Only when focus would otherwise be lost: it is still on this element (a
 * shadow-internal node reads as the host from the document) or it has fallen
 * to the body because the focused option was just hidden. When the panel
 * closed because someone clicked another control, that control already has
 * focus, and pulling it back made the next key go to the wrong field -- with
 * two selects, ArrowDown in the second reopened the first.
 */
export function shouldReturnFocus(host: HTMLElement): boolean {
  const active = host.ownerDocument.activeElement;
  return !active || active === host.ownerDocument.body || active === host || host.contains(active);
}

/** The focused element, looked for through open shadow roots. */
export function deepActiveElement(root: Document | ShadowRoot = document): HTMLElement | null {
  let active = root.activeElement as HTMLElement | null;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement as HTMLElement;
  return active;
}
