import { setProjectAnnotations } from '@storybook/react-vite';

setProjectAnnotations({
  initialGlobals: {
    theme: 'dark',
  },
  parameters: {
    a11y: {
      test: 'error',
    },
  },
});
