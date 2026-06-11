export const Keys = {
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  End: 'End',
  Enter: 'Enter',
  Escape: 'Escape',
  Home: 'Home',
  Space: ' ',
  Tab: 'Tab',
} as const;

export const isActivationKey = (key: string) => key === Keys.Enter || key === Keys.Space;

export const composeDescribedBy = (...ids: Array<string | false | null | undefined>) =>
  ids.filter(Boolean).join(' ') || undefined;

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
