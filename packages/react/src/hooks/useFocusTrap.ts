import { useEffect } from 'react';
import { getFocusableElements, Keys } from '../a11y';

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
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    const container = containerRef.current;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const initialFocusable = container
      ? getFocusableElements(container)[0]
      : undefined;

    if (initialFocusable) {
      initialFocusable.focus();
    } else {
      container?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === Keys.Escape) {
        onEscape?.();
        return;
      }

      if (event.key !== Keys.Tab || !containerRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isInsideDialog = activeElement
        ? containerRef.current.contains(activeElement)
        : false;

      if (!isInsideDialog) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocus) {
        previousActiveElement?.focus?.();
      }
    };
  }, [containerRef, enabled, onEscape, restoreFocus]);
}
