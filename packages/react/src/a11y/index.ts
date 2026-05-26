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

export const isActivationKey = (key: string) =>
  key === Keys.Enter || key === Keys.Space;

export const composeDescribedBy = (
  ...ids: Array<string | false | null | undefined>
) => ids.filter(Boolean).join(' ') || undefined;

export const getFocusableElements = (container: HTMLElement) => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => {
      if (
        element.hasAttribute('disabled') ||
        element.getAttribute('aria-hidden') === 'true'
      ) {
        return false;
      }

      return element.offsetParent !== null;
    },
  );
};
