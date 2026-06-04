import type { Decorator } from '@storybook/react-vite';

export const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as string) ?? 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.body.style.background = 'var(--color-semantic-background-default)';
  return <Story />;
};
