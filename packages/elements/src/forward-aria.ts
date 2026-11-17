/**
 * ARIA state a wrapper element writes onto a button host, copied onto the
 * button that actually takes focus.
 *
 * `pf-popover`, `pf-dropdown` and `pf-tooltip` set `aria-expanded`,
 * `aria-haspopup` and `aria-description` on their trigger -- which in every
 * documented example is a `pf-button`, a role-less host whose focusable
 * `<button>` is in its own shadow root. On a generic host those attributes are
 * ignored, so the button a screen reader lands on announced neither the
 * tooltip nor whether the menu was open. Plain values only: an IDREF such as
 * `aria-controls` would not resolve from inside the shadow root anyway.
 */
export const FORWARDED_ARIA = [
  'aria-expanded',
  'aria-haspopup',
  'aria-pressed',
  'aria-current',
  'aria-description',
] as const;

export type ForwardedAria = Partial<Record<(typeof FORWARDED_ARIA)[number], string>>;

export function readForwardedAria(host: HTMLElement): ForwardedAria {
  const next: ForwardedAria = {};
  for (const name of FORWARDED_ARIA) {
    const value = host.getAttribute(name);
    if (value !== null) next[name] = value;
  }
  return next;
}

export function sameForwardedAria(a: ForwardedAria, b: ForwardedAria): boolean {
  return FORWARDED_ARIA.every((name) => a[name] === b[name]);
}

/** Watches the host and calls back when any forwarded attribute changes. */
export function observeForwardedAria(host: HTMLElement, onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(host, { attributes: true, attributeFilter: [...FORWARDED_ARIA] });
  return () => observer.disconnect();
}
