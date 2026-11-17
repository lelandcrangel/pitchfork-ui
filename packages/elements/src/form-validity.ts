/**
 * The validity rules every form-associated element here shares.
 *
 * Not in `@pitchfork-ui/core`: this is about `ElementInternals`, which only
 * the elements layer has. The React components are native inputs and get all
 * of it from the browser.
 *
 * Shared between the elements because the alternative is each one inventing
 * its own precedence between `error` and `required`, and a design system whose
 * controls disagree about which message wins is worse than one with no
 * messages.
 */

export interface ValidityState_ {
  flags: ValidityStateFlags;
  message: string;
}

/**
 * `error` wins over `required`. A consumer who has set an error message has
 * already decided what to say; "This field is required." would overwrite a
 * server's own answer with a guess.
 */
export function resolveControlValidity(
  hasValue: boolean,
  required: boolean,
  error: string | undefined,
): ValidityState_ {
  if (error) return { flags: { customError: true }, message: error };
  if (required && !hasValue) {
    return { flags: { valueMissing: true }, message: 'This field is required.' };
  }
  return { flags: {}, message: '' };
}

/** Applies `resolveControlValidity` to an element's internals. */
export function applyControlValidity(
  internals: ElementInternals,
  hasValue: boolean,
  required: boolean,
  error: string | undefined,
): void {
  const { flags, message } = resolveControlValidity(hasValue, required, error);
  internals.setValidity(flags, message);
}

/**
 * The browser's own type-mismatch message for `value` in a native input of
 * `type`, or `''` when the value is fine (or the type has no format to check).
 *
 * A form-associated element whose real input sits in a shadow root gets none
 * of that input's constraints -- `<pf-input type="email" value="foo">` passed
 * `checkValidity()` and submitted, where a native field refuses it. A detached
 * probe asks the browser rather than reimplementing its email and URL rules,
 * and answers for the value being set now rather than the one last rendered.
 */
let probe: HTMLInputElement | undefined;

export function typeMismatchMessage(type: string, value: string): string {
  if (type !== 'email' && type !== 'url') return '';
  if (typeof document === 'undefined') return '';
  probe ??= document.createElement('input');
  probe.type = type;
  probe.value = value;
  return probe.validity?.typeMismatch ? probe.validationMessage : '';
}
