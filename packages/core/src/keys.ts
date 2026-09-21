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
