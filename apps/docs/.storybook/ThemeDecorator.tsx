import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Decorator } from '@storybook/react-vite';

const buttonStyle: React.CSSProperties = {
  minHeight: '34px',
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: '8px',
  background: 'var(--color-semantic-background-default)',
  color: 'var(--color-semantic-text-default)',
  cursor: 'pointer',
  padding: '0 12px',
  fontSize: '12px',
  fontWeight: 600,
  boxShadow: 'var(--pf-elevation-popover-shadow)',
};

function ThemeTogglePortal() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = 'var(--color-semantic-background-default)';
  }, [theme]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{ position: 'fixed', right: '16px', bottom: '58px', zIndex: 200 }}>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      >
        {theme === 'light' ? '☀︎ Light' : '☾ Dark'}
      </button>
    </div>,
    document.body,
  );
}

export const withTheme: Decorator = (Story, context) => {
  // Show the light/dark toggle on Interactive component stories and on all
  // Patterns stories so both themes can be previewed.
  const showToggle =
    context.name === 'Interactive' || Boolean(context.title?.startsWith('Patterns/'));

  if (!showToggle) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.style.background = 'var(--color-semantic-background-default)';
    return <Story />;
  }

  return (
    <>
      <ThemeTogglePortal />
      <Story />
    </>
  );
};
