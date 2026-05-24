import type { Preview } from '@storybook/react-vite';
import '@pitchfork-ui/react/styles.css';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { mswHandlers } from './msw-handlers';
import { withCssVariableControls } from './CssVariableDecorator';

initialize({
  onUnhandledRequest: 'bypass',
  quiet: true,
  serviceWorker: {
    url: './mockServiceWorker.js',
  },
});

const preview: Preview = {
  decorators: [withCssVariableControls],
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: mswHandlers,
    },
    a11y: {
      test: 'todo',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          [
            'Introduction',
            'Tokens',
            // ...add other Foundations docs here as needed
            'Changelog',
          ],
          'Components',
        ],
        method: 'alphabetical',
        locales: 'en-US',
      },
    },
  },
};

export default preview;
