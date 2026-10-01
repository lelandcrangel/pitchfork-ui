import globalData from '@csstools/postcss-global-data';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { postcss } from '@stencil/postcss';
import { Config } from '@stencil/core';
import customMedia from 'postcss-custom-media';
import { resolve } from 'node:path';

/**
 * The `--pf-*` alias layer, in its neutral home alongside the tokens it
 * aliases. Read twice, for two different reasons:
 *
 * - the source copy supplies `@custom-media` definitions to PostCSS at build
 *   time, so the 32 `@media (--sm/--md)` queries in component CSS resolve;
 * - the built copy is the `globalStyle` below, shipped so an elements-only
 *   consumer gets styled components.
 */
const themeCssSource = resolve(__dirname, '../tokens/src/theme.css');
const themeCssBuilt = resolve(__dirname, '../tokens/dist/css/theme.css');

export const config: Config = {
  namespace: 'pitchfork',
  /**
   * Without this a consumer gets tokens but every `--pf-*` resolves to
   * nothing: markup and class names are perfect and the buttons have no
   * background. Stencil's own importer handles the `@import './variables.css'`
   * at the top of this file, which is why it can be pointed at the built
   * stylesheet directly -- a bare `@pitchfork-ui/tokens/css` specifier could
   * not be, and used to need a concatenation step.
   */
  globalStyle: themeCssBuilt,
  taskQueue: 'async',
  sourceMap: true,
  outputTargets: [
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      // The React output target requires the runtime to be bundled into each
      // component rather than imported from @stencil/core at runtime.
      externalRuntime: false,
    },
    // esmLoaderPath puts the loader at the package root, so consumers can
    // import '@pitchfork-ui/elements/loader' as the exports map promises.
    { type: 'dist', esmLoaderPath: '../loader' },
    { type: 'docs-json', file: 'dist/docs.json' },
    // Typed React components generated from these elements. The hand-written
    // @pitchfork-ui/react owns that name, so the generated bindings are
    // elements-react -- and every framework wrapper is elements-<framework>,
    // rather than React being special-cased because of a name collision.
    reactOutputTarget({
      outDir: '../elements-react/src/components',
      esModules: true,
    }),
    // Standalone Angular components, plus the ControlValueAccessor directives
    // that let a form control bind with formControlName / ngModel. This is the
    // capability the engine was chosen for -- a Lit element would need these
    // hand-written, once per control.
    angularOutputTarget({
      componentCorePackage: '@pitchfork-ui/elements',
      directivesProxyFile: '../elements-angular/src/lib/components.ts',
      outputType: 'standalone',
      valueAccessorConfigs: [
        {
          elementSelectors: ['pf-input'],
          // pfChange is emitted on commit, which is the moment Angular should
          // see a new value; pfInput fires on every keystroke.
          event: 'pfChange',
          targetAttr: 'value',
          type: 'text',
        },
        {
          // A boolean accessor writes `checked`, not `value`. One config for
          // both because a switch is a checkbox with a different role, and
          // Angular binds them identically.
          elementSelectors: ['pf-checkbox', 'pf-switch'],
          event: 'pfChange',
          targetAttr: 'checked',
          type: 'boolean',
        },
      ],
    }),
  ],
  plugins: [
    // The same chain packages/react runs through Vite, so the 32
    // `@media (--sm/--md)` queries and the token alias chain behave
    // identically in both layers.
    postcss({
      plugins: [globalData({ files: [themeCssSource] }), customMedia()],
    }),
  ],
  testing: {
    browserHeadless: 'shell',
  },
  extras: {
    experimentalImportInjection: true,
  },
};
