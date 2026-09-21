import { trapFocus } from '@pitchfork-ui/core';
import { useEffect } from 'react';

export interface UseFocusTrapOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}

export function useFocusTrap({
  containerRef,
  enabled = true,
  onEscape,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    return trapFocus({
      getContainer: () => containerRef.current,
      onEscape,
      restoreFocus,
    });
  }, [containerRef, enabled, onEscape, restoreFocus]);
}
