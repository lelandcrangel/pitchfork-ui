import { trapFocus } from '@pitchfork-ui/core';
import { useEffect } from 'react';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `trapFocus` from `@pitchfork-ui/core` — or nothing: `<pf-modal>` is a native `<dialog>` opened with `showModal()`, which traps focus itself. */
export interface UseFocusTrapOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `trapFocus` from `@pitchfork-ui/core` — or nothing: `<pf-modal>` is a native `<dialog>` opened with `showModal()`, which traps focus itself. */
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
