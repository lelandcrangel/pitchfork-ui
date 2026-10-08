/**
 * A value is controlled when the owner passes one explicitly. `undefined` means
 * "you keep track of it" — which is why `null` is a controlled value and
 * `undefined` is not.
 */
export const isControlledValue = <T>(value: T | undefined) => value !== undefined;

/** Resolves the `setState`-style updater form against the current value. */
export function resolveNextValue<T>(
  nextValue: T | ((currentValue: T | undefined) => T),
  currentValue: T | undefined,
): T {
  return typeof nextValue === 'function'
    ? (nextValue as (currentValue: T | undefined) => T)(currentValue)
    : nextValue;
}
