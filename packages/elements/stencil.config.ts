import globalData from '@csstools/postcss-global-data';
import { postcss } from '@stencil/postcss';
import { Config } from '@stencil/core';
import customMedia from 'postcss-custom-media';
import { resolve } from 'node:path';

/**
 * `theme.css` is read at build time only, for its `@custom-media` definitions —
 * nothing from it is inlined. It still lives in packages/react because that is
 * where the theming contract has always been; the `:root` custom properties it
 * declares reach these components at runtime by inheriting through the shadow
 * boundary, exactly as they do for the React library.
 */
const themeCss = resolve(__dirname, '../react/src/styles/theme.css');

export const config: Config = {
  namespace: 'pitchfork',
  taskQueue: 'async',
  sourceMap: true,
  outputTargets: [
    { type: 'dist-custom-elements', customElementsExportBehavior: 'auto-define-custom-elements' },
    // esmLoaderPath puts the loader at the package root, so consumers can
    // import '@pitchfork-ui/elements/loader' as the exports map promises.
    { type: 'dist', esmLoaderPath: '../loader' },
    { type: 'docs-json', file: 'dist/docs.json' },
  ],
  plugins: [
    // The same chain packages/react runs through Vite, so the 32
    // `@media (--sm/--md)` queries and the token alias chain behave
    // identically in both layers.
    postcss({
      plugins: [globalData({ files: [themeCss] }), customMedia()],
    }),
  ],
  testing: {
    browserHeadless: 'shell',
  },
  extras: {
    experimentalImportInjection: true,
  },
};
