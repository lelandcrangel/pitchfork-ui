import { noop } from './internal';
import { Keys } from './keys';

const isElementVisible = (element: HTMLElement) => {
  // Most accurate where supported (display/visibility/content-visibility).
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }

  // offsetParent is null inside display:none subtrees — but also for
  // position: fixed elements, which feed the modal focus trap, so visible
  // fixed elements are rescued via their client rects.
  return element.offsetParent !== null || element.getClientRects().length > 0;
};

export const getFocusableElements = (container: HTMLElement) => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    // contenteditable="" is also valid/enabled; only "false" disables editing.
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return isElementVisible(element);
  });
};

export interface TrapFocusOptions {
  /**
   * Read fresh on every keypress rather than captured once, so a container that
   * mounts or swaps after the trap is installed still works.
   */
  getContainer: () => HTMLElement | null | undefined;
  onEscape?: () => void;
  /** Return focus to whatever held it when the trap was installed. Defaults to true. */
  restoreFocus?: boolean;
}

/**
 * Moves focus into the container and keeps Tab cycling inside it. Returns a
 * cleanup function that removes the listener and, unless told otherwise,
 * restores focus to the previously active element.
 */
export function trapFocus({
  getContainer,
  onEscape,
  restoreFocus = true,
}: TrapFocusOptions): () => void {
  if (typeof document === 'undefined') {
    return noop;
  }

  const container = getContainer();
  const previousActiveElement = document.activeElement as HTMLElement | null;
  const initialFocusable = container ? getFocusableElements(container)[0] : undefined;

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

    if (event.key !== Keys.Tab) {
      return;
    }

    const current = getContainer();
    if (!current) {
      return;
    }

    const focusableElements = getFocusableElements(current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      current.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;
    const isInsideDialog = activeElement ? current.contains(activeElement) : false;

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
}
