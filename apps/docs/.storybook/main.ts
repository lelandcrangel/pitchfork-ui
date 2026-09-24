import globalData from '@csstools/postcss-global-data';
import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import customMedia from 'postcss-custom-media';

const storybookDir = dirname(fileURLToPath(import.meta.url));
const reactSourceEntry = resolve(storybookDir, '../../../packages/react/src/index.ts');
// The published package ships a single styles.css; from source, the equivalent
// entry point is theme.css, which defines the design tokens and every --pf-*
// alias on :root. Aliasing the stylesheet specifier to the TypeScript entry
// instead made preview.ts's `import '@pitchfork-ui/react/styles.css'` a
// side-effect-only import of a module Rollup treats as side-effect-free, so the
// whole chain -- theme.css included -- was tree-shaken out of the build. Every
// component class still landed, so the site rendered with correct markup and no
// token values at all, and nothing failed loudly enough to notice.
const reactThemeCss = resolve(storybookDir, '../../../packages/react/src/styles/theme.css');

const rawBasePath = process.env.STORYBOOK_BASE_PATH ?? '/';
const withLeadingSlash = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`;
const storybookBasePath = withLeadingSlash.endsWith('/')
  ? withLeadingSlash
  : `${withLeadingSlash}/`;

// `title` is a Storybook preset the manager renders as "<title> - Storybook".
// It isn't in the StorybookConfig type, and unset it falls back to
// "storybook", which is what link previews showed before manager-head.html.
const config: StorybookConfig & { title: string } = {
  title: 'Pitchfork UI',
  stories:['../src/**/*.mdx', '../src/**/*.stories.{js,jsx,mjs,ts,tsx}'],
  tags: {
    examplesHidden: {
      excludeFromSidebar: true,
    },
  },
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    config.build = {
      ...(config.build ?? {}),
      minify: false,
    };
    config.base = storybookBasePath;
    config.css = {
      ...(config.css ?? {}),
      postcss: {
        plugins: [
          globalData({
            files: [resolve(storybookDir, '../../../packages/react/src/styles/theme.css')],
          }),
          customMedia(),
        ],
      },
    };
    config.resolve = {
      ...(config.resolve ?? {}),
      alias: [
        {
          find: '@pitchfork-ui/react/styles.css',
          replacement: reactThemeCss,
        },
        {
          find: '@pitchfork-ui/react',
          replacement: reactSourceEntry,
        },
      ],
    };

    return config;
  },
};

export default config;
