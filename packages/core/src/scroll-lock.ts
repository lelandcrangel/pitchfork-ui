/**
 * Lock page scroll, returning the function that releases it.
 *
 * A modal overlay has to do this itself: `<dialog>.showModal()` gives the
 * focus trap, Escape and the backdrop, but it does *not* stop the page behind
 * from scrolling — measured with a real wheel event over an open modal.
 *
 * Reference-counted, because overlays nest. Two elements each storing "the
 * previous overflow" independently is a bug with a clear shape: the second to
 * open records `hidden` as the value to restore, so when it closes the page
 * stays locked for as long as the first one lives, and if the first closes
 * first the page unlocks while a modal is still up. Only the outermost lock
 * records the real value and only the last release restores it.
 *
 * Releasing twice is a no-op rather than an unbalanced decrement, so a caller
 * that releases in both a close handler and a disconnect callback — which is
 * what an element removed while open does — cannot drop the count below the
 * number of holders.
 */
let holders = 0;
let restoreTo: string | null = null;

export function lockPageScroll(): () => void {
  const target = document.documentElement;

  if (holders === 0) {
    restoreTo = target.style.overflow;
    target.style.overflow = 'hidden';
  }
  holders += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders > 0) return;
    target.style.overflow = restoreTo ?? '';
    restoreTo = null;
  };
}
