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
// react's source imports @pitchfork-ui/core; without this alias Storybook would
// resolve it to core's dist, which means `npm run storybook` on a fresh clone
// fails until core has been built.
const coreSourceEntry = resolve(storybookDir, '../../../packages/core/src/index.ts');

const rawBasePath = process.env.STORYBOOK_BASE_PATH ?? '/';
const withLeadingSlash = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`;
const storybookBasePath = withLeadingSlash.endsWith('/')
  ? withLeadingSlash
  : `${withLeadingSlash}/`;

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.{js,jsx,mjs,ts,tsx}'],
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
        {
          find: '@pitchfork-ui/core',
          replacement: coreSourceEntry,
        },
      ],
    };

    return config;
  },
};

export default config;
