import { useCallback, useState } from 'react';

export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>) {
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    (nextValue: T | ((currentValue: T | undefined) => T)) => {
      const resolvedValue =
        typeof nextValue === 'function'
          ? (nextValue as (currentValue: T | undefined) => T)(currentValue)
          : nextValue;

      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange],
  );

  return [currentValue, setValue, isControlled] as const;
}
