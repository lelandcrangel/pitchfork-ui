import globalData from '@csstools/postcss-global-data';
import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import customMedia from 'postcss-custom-media';
import remarkGfm from 'remark-gfm';

const storybookDir = dirname(fileURLToPath(import.meta.url));
// Read only for its `@custom-media` definitions, which are authored in src.
// `preview.ts` loads the built `theme.css` through the package's own exports
// map, which is where the token values come from.
const themeCssSource = resolve(storybookDir, '../../../packages/tokens/src/theme.css');
// The patterns import `sortRowsBy` from core. Pointing at the source means
// `npm run storybook` does not need core built first -- the elements do need
// their own build, but that is their exports map, not an alias.
const coreSourceEntry = resolve(storybookDir, '../../../packages/core/src/index.ts');

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
  stories: ['../src/**/*.mdx', '../src/**/*.stories.{js,jsx,mjs,ts,tsx}'],
  tags: {
    examplesHidden: {
      excludeFromSidebar: true,
    },
  },
  addons: [
    {
      // Storybook's MDX pipeline runs remark with no GFM extension, so a
      // pipe table renders as a paragraph of pipe characters. That was a
      // curiosity while one page had a table; the 108 generated element
      // reference pages are almost entirely tables, so without this the
      // whole web-components section of the site is pipe soup. Probed by
      // removing the plugin again: `<table` disappears from the built
      // output and the pipes come back as text.
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-a11y',
  ],
  staticDirs: ['../public'],
  // Storybook writes its own <link rel="icon" href="./favicon.svg"> into the
  // manager HTML and serves whatever favicon.svg the static dir holds, so
  // dropping ours into apps/docs/public is enough to replace the Storybook
  // logo. The .ico and the touch icon are not in that generated markup, so
  // they are linked here by hand.
  managerHead: (head) => `${head}
    <link rel="icon" href="./favicon.ico" sizes="16x16 32x32 48x48" />
    <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
    <meta name="theme-color" content="#0f172a" />
  `,
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
            files: [themeCssSource],
          }),
          customMedia(),
        ],
      },
    };
    config.resolve = {
      ...(config.resolve ?? {}),
      alias: [
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
