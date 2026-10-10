import type { Preview } from '@storybook/react-vite';
import '@pitchfork-ui/react/styles.css';
import { defineCustomElements } from '@pitchfork-ui/elements/loader';
import { withCssVariableControls } from './CssVariableDecorator';
import { withTheme } from './ThemeDecorator';

/*
 * Registers all 108 custom elements, so the generated reference pages can show
 * a live one. Before this they were tables describing elements the page could
 * not render -- which is the wrong way round for the part of this site that
 * exists to help someone decide whether to move off the React components.
 *
 * Two things this deliberately does not do.
 *
 * It does not import `@pitchfork-ui/elements/styles.css`. That file is the
 * token sheet, and `main.ts` already aliases `@pitchfork-ui/react/styles.css`
 * to the same built `theme.css` from @pitchfork-ui/tokens -- both layers ship
 * it and neither owns it. A second copy on `:root` would be redundant at best
 * and, if the two builds ever drifted, a source of a difference nobody could
 * see. Each element's own CSS is injected into its shadow root by the loader,
 * so nothing global is missing.
 *
 * And `main.ts` has no alias to the elements' source, for the same reason
 * `apps/consumer-react/vite.config.ts` has none: this resolves through the
 * package's own exports map, which is the path a source alias hides. The cost
 * is that `npm run storybook` on a fresh clone needs `npm run build:elements`
 * first -- `npm run build` already runs them in that order.
 */
defineCustomElements();

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

const preview: Preview = {
  decorators: [withTheme, withCssVariableControls],
  parameters: {
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
        order: [
          'Foundations',
          ['Introduction', 'Theming', 'Tokens', 'Changelog'],
          'Patterns',
          'Components',
        ],
        method: 'alphabetical',
        locales: 'en-US',
      },
    },
  },
};

export default preview;
