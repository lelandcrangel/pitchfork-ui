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
