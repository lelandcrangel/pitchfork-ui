import type { Preview } from '@storybook/react-vite';
import '@pitchfork-ui/react/styles.css';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { mswHandlers } from './msw-handlers';
import { withCssVariableControls } from './CssVariableDecorator';
import { withTheme } from './ThemeDecorator';

const pitchforkViewports = {
  mobile: {
    name: 'Mobile (< 640px)',
    styles: { width: '390px', height: '844px' },
    type: 'mobile' as const,
  },
  sm: {
    name: 'sm — 640px',
    styles: { width: '640px', height: '900px' },
    type: 'tablet' as const,
  },
  md: {
    name: 'md — 768px',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  lg: {
    name: 'lg — 1024px',
    styles: { width: '1024px', height: '768px' },
    type: 'desktop' as const,
  },
  xl: {
    name: 'xl — 1280px',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop' as const,
  },
};

initialize({
  onUnhandledRequest: 'bypass',
  quiet: true,
  serviceWorker: {
    url: './mockServiceWorker.js',
  },
});

const preview: Preview = {
  decorators: [withTheme, withCssVariableControls],
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: mswHandlers,
    },
    a11y: {
      test: 'todo',
    },
    viewport: {
      viewports: pitchforkViewports,
      defaultViewport: 'responsive',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Foundations', ['Introduction', 'Theming', 'Tokens', 'Changelog'], 'Components'],
        method: 'alphabetical',
        locales: 'en-US',
      },
    },
  },
};

export default preview;
