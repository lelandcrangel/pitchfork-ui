import { isControlledValue, resolveNextValue } from '@pitchfork-ui/core';
import { useCallback, useState } from 'react';

/** @deprecated `@pitchfork-ui/react` is deprecated. The controlled/uncontrolled decision is `isControlledValue` and `resolveNextValue` in `@pitchfork-ui/core`; the `useState` around them is yours. */
export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. The controlled/uncontrolled decision is `isControlledValue` and `resolveNextValue` in `@pitchfork-ui/core`; the `useState` around them is yours. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>) {
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const isControlled = isControlledValue(value);
  const currentValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    (nextValue: T | ((currentValue: T | undefined) => T)) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);

      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange],
  );

  return [currentValue, setValue, isControlled] as const;
}
