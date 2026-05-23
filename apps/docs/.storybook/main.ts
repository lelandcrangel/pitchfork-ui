import type { StorybookConfig } from '@storybook/react-vite';

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
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
  ],
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

    return config;
  },
};

export default config;
