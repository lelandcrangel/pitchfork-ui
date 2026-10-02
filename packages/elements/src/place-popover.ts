/**
 * Position a popover panel at a point in client coordinates.
 *
 * `inset: auto` and `margin: 0` are not tidying — they are what makes `left`
 * and `top` mean what they say. The UA stylesheet gives `[popover]`
 * `inset: 0` and `margin: auto`, which *centres* it, so setting `left` alone
 * adjusts an inset that `margin: auto` then re-centres within. Measured: with
 * the UA defaults, `left: 120px` on a 180px-wide popover in a 600px viewport
 * lands at 263.
 *
 * Set inline rather than in each component's stylesheet so a panel is
 * positioned correctly even where that stylesheet has not been applied —
 * which includes the browser test project, and a consumer who forgot
 * `styles.css`.
 */
export function placePopover(panel: HTMLElement, left: number, top: number): void {
  panel.style.inset = 'auto';
  panel.style.margin = '0';
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}
