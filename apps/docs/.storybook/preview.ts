import type { Preview } from '@storybook/react-vite';
import '@pitchfork-ui/react/styles.css';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { mswHandlers } from './msw-handlers';

initialize({ onUnhandledRequest: 'bypass', quiet: true });

const preview: Preview = {
  decorators: [(Story) => Story()],
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
        order: ['Foundations', 'Components'],
        method: 'alphabetical',
        locales: 'en-US',
      },
    },
  },
};

export default preview;
