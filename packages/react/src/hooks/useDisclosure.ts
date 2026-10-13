import { useCallback } from 'react';
import { useControllableState } from './useControllableState';

/** @deprecated `@pitchfork-ui/react` is deprecated. A `useState` boolean. There is no framework-free half to move to, and no element replaces it. */
export interface UseDisclosureOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. A `useState` boolean. There is no framework-free half to move to, and no element replaces it. */
export function useDisclosure({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
}: UseDisclosureOptions = {}) {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const openDisclosure = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled, setIsOpen]);

  const closeDisclosure = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const toggleDisclosure = useCallback(() => {
    if (!disabled) {
      setIsOpen((current) => !current);
    }
  }, [disabled, setIsOpen]);

  return {
    isOpen,
    setIsOpen,
    open: openDisclosure,
    close: closeDisclosure,
    toggle: toggleDisclosure,
  };
}
