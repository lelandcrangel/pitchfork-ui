import globalData from '@csstools/postcss-global-data';
import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import customMedia from 'postcss-custom-media';

const storybookDir = dirname(fileURLToPath(import.meta.url));
const reactSourceEntry = resolve(
  storybookDir,
  '../../../packages/react/src/index.ts',
);

const rawBasePath = process.env.STORYBOOK_BASE_PATH ?? '/';
const withLeadingSlash = rawBasePath.startsWith('/')
  ? rawBasePath
  : `/${rawBasePath}`;
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
          replacement: reactSourceEntry,
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
