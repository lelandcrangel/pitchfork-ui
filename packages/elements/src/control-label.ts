/**
 * How a form control here gets an accessible name when it has no visible one.
 *
 * Not in `@pitchfork-ui/core`: it is about the shadow boundary, which only
 * this layer has.
 *
 * The React components extend `InputHTMLAttributes`, so
 * `<Input aria-label="Search" />` lands the attribute on the real `<input>`
 * and names it. An element cannot do that. `aria-label` on the host names the
 * **host**, and the host is not the control -- the `<input>` lives in the
 * shadow root with nothing pointing at it, so a consumer who writes the same
 * thing gets a control with no accessible name at all and no warning. Measured
 * against Chromium's accessibility tree: the host reports the name and the
 * textbox inside it reports none.
 *
 * `aria-labelledby` has no answer either, for the rule this library keeps
 * running into: an IDREF cannot point into a shadow root. So the text is
 * copied across, which is what `pf-tooltip` does for its trigger's
 * description and for the same reason.
 *
 * A visible `label` wins, because it is both the name and a `for` target in
 * the control's own root -- the kind of reference that does resolve.
 */
export function controlAriaLabel(host: HTMLElement, label: string | undefined): string | null {
  if (label) return null;
  const copied = host.getAttribute('aria-label');
  return copied && copied.trim().length > 0 ? copied : null;
}
