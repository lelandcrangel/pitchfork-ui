/**
 * The element an overlay hangs off: the first child in the default slot.
 *
 * Not `firstElementChild`. A consumer is free to write the named-slot content
 * first -- `<div slot="content">` before the button, which is how a loop over
 * data or a framework's own ordering often comes out -- and then the content
 * itself became the trigger: clicking the button did nothing, clicking the
 * content toggled the panel, and a tooltip described and anchored to its own
 * text.
 */
export function defaultSlotTrigger(host: HTMLElement): HTMLElement | null {
  for (const child of Array.from(host.children)) {
    if (!child.hasAttribute('slot')) return child as HTMLElement;
  }
  return null;
}
