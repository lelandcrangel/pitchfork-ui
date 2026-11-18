import globalData from '@csstools/postcss-global-data';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { postcss } from '@stencil/postcss';
import { Config } from '@stencil/core';
import customMedia from 'postcss-custom-media';
import type { PluginCreator } from 'postcss';
import { resolve, sep } from 'node:path';

/**
 * The `--pf-*` alias layer, in its neutral home alongside the tokens it
 * aliases. Read twice, for two different reasons:
 *
 * - the source copy supplies `@custom-media` definitions to PostCSS at build
 *   time, so the 32 `@media (--sm/--md)` queries in component CSS resolve;
 * - the built copy is the `globalStyle` below, which Stencil emits as
 *   `dist/pitchfork/pitchfork.css` -- the `styles.css` a consumer loads once.
 */
const themeCssSource = resolve(__dirname, '../tokens/src/theme.css');
const themeCssBuilt = resolve(__dirname, '../tokens/dist/css/theme.css');

/**
 * The one rule of the token sheet that does anything inside a shadow root.
 *
 * Stencil used to attach the whole `globalStyle` -- 42.5 KB -- to every shadow
 * root, and almost all of it is dead there: `:root`, `body` and
 * `[data-theme='dark']` match nothing inside a shadow tree, and the
 * custom properties reach the elements by inheritance from the document
 * anyway, which is why a consumer loads `styles.css` at all. What did match
 * was the `*, *::before, *::after` box-sizing reset, and the element
 * stylesheets are written against it. So it goes into each of them instead,
 * and `addGlobalStyleToComponents: false` stops the rest travelling in the
 * JavaScript, being adopted into every root, and -- on a browser without
 * constructable stylesheets -- being parsed once per element on the page.
 */
const shadowRootReset: PluginCreator<void> = () => ({
  postcssPlugin: 'pitchfork-shadow-root-reset',
  Once(root, { parse }) {
    const file = root.source?.input.file ?? '';
    if (!file.includes(`${sep}src${sep}components${sep}`)) return;
    root.prepend(parse('*, *::before, *::after { box-sizing: border-box; }'));
  },
});
shadowRootReset.postcss = true;

/**
 * Makes each lazy entry fetch the elements its component renders, alongside
 * itself rather than after it.
 *
 * The lazy loader asks for an element's bundle when the element connects, and
 * an element rendered inside another's shadow root connects only once the
 * parent's bundle has arrived, run and rendered. So every level of nesting
 * cost more trips: measured over HTTP/2 at 80 ms of latency, `pf-tab` waited
 * for its own bundle and that bundle's chunks before it asked for
 * `pf-badge`, and a page of seven common elements made its entry requests in
 * three waves and hydrated in about 560 ms. With this, two waves and about
 * 465 ms. Stencil has no preload of its own for this -- `bundles` can only put
 * one component in one bundle, and `pf-icon` is rendered by 25 of them.
 *
 * The cost is that an entry fetches what its component *can* render, not only
 * what it does: a closed `pf-date-picker` now brings `pf-calendar` with it,
 * which is also what makes its first open not wait on the network.
 *
 * Stencil's lazy entries are virtual modules named `<tag>.entry`, each
 * re-exporting one component. This reads the component's compiled module for
 * the `h('pf-…')` calls that render another element and gives the entry a
 * bare `import '<that tag>.entry'`, so Rollup emits a static import between
 * the two entry chunks: the browser fetches the child as soon as it parses
 * the parent, and when the parent renders, the loader's own `import()` of the
 * child resolves from the module map without a request. Stencil's
 * `lazyBundleIdPlugin` already rewrites imports between entries, so the
 * hashed names in `dist/pitchfork` come out right too.
 *
 * `no-treeshake` is what keeps the import: an entry only re-exports a class,
 * which has no side effects, so Rollup would otherwise drop a bare import of
 * it. The custom-elements build has no `.entry` modules, so this never runs
 * there -- it already imports each dependency to define it.
 * `scripts/check-built-packages.mjs` asserts every dependency in `docs.json`
 * is imported by its parent's entry.
 */
const preloadRenderedElements = () => ({
  name: 'pitchfork-preload-rendered-elements',
  /*
   * `allow-extension`, in the lazy build only, so the child's own entry chunk
   * stays the one the parent imports. Once 25 entries import `pf-icon.entry`,
   * core's icon helpers are needed by exactly the entries that need pf-icon,
   * so Rollup puts them in its chunk -- and under Stencil's `strict` it may
   * not export them from an entry, so it moved pf-icon into a shared chunk
   * behind a one-line facade, and the facade was a serial request of its own.
   * The loader reads an entry's component by name, so an extra export is
   * harmless.
   */
  options(options: { input?: unknown; preserveEntrySignatures?: unknown }) {
    const input = options.input;
    const keys =
      input && typeof input === 'object' && !Array.isArray(input)
        ? Object.keys(input)
        : Array.isArray(input)
          ? input.map(String)
          : [];
    if (!keys.some((key) => key.endsWith('.entry'))) return null;
    return { ...options, preserveEntrySignatures: 'allow-extension' };
  },
  async transform(
    this: {
      resolve: (source: string, importer: string) => Promise<{ id: string } | null>;
      load: (options: { id: string }) => Promise<{ code: string | null }>;
    },
    code: string,
    id: string,
  ) {
    const match = /^(pf-[a-z0-9-]+)\.entry$/.exec(id);
    if (!match) return null;

    const own = match[1];
    const rendered = new Set<string>();
    for (const [, source] of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const resolved = await this.resolve(source, id);
      if (!resolved) continue;
      const module = await this.load({ id: resolved.id });
      for (const [, tag] of (module.code ?? '').matchAll(/\bh\(\s*["'](pf-[a-z0-9-]+)["']/g)) {
        if (tag !== own) rendered.add(tag);
      }
    }

    const imports = [...rendered].sort().map((tag) => `import '${tag}.entry';`);
    return { code: [code, ...imports].join('\n'), map: null, moduleSideEffects: 'no-treeshake' };
  },
});

export const config: Config = {
  namespace: 'pitchfork',
  /**
   * Without this a consumer gets tokens but every `--pf-*` resolves to
   * nothing: markup and class names are perfect and the buttons have no
   * background. Stencil's own importer handles the `@import './variables.css'`
   * at the top of this file, which is why it can be pointed at the built
   * stylesheet directly -- a bare `@pitchfork-ui/tokens/css` specifier could
   * not be, and used to need a concatenation step.
   *
   * It reaches the page as `styles.css` only; see `shadowRootReset` above for
   * why it is no longer attached to each element too.
   */
  globalStyle: themeCssBuilt,
  taskQueue: 'async',
  sourceMap: true,
  outputTargets: [
    {
      type: 'dist-custom-elements',
      // `default`, not `auto-define-custom-elements`: a module that registers
      // its element on import has a side effect, so a bundler must keep every
      // one a binding imports, and each binding imports all 108 from one file.
      // An Angular or Vue app using one PfBadge shipped them all -- about
      // 100 KB gzipped. Every binding calls `defineCustomElement()` itself, and
      // `"sideEffects"` in package.json says the modules are safe to drop.
      // `npm run check:binding-size` holds it.
      customElementsExportBehavior: 'default',
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
          // pfChange is emitted on commit, which is the moment Angular should
          // see a new value; pfInput fires on every keystroke.
          //
          // One config per `type`, never two: the generator merges the
          // selectors of same-typed configs but emits the host binding once
          // per config, so a second 'text' entry produces a duplicate
          // `'(pfChange)'` key and TS1117. pf-radio-group belongs here because
          // the group is the control — one name, one string value.
          elementSelectors: ['pf-input', 'pf-textarea', 'pf-radio-group'],
          event: 'pfChange',
          targetAttr: 'value',
          type: 'text',
        },
        {
          // A slider is numeric: without this Angular would store the string
          // the DOM gives it, and a `min`/`max` validator comparing it to a
          // number would compare a string instead.
          elementSelectors: ['pf-slider'],
          event: 'pfChange',
          targetAttr: 'value',
          type: 'number',
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
    // Vue components generated from the same elements. Vue can render a
    // custom element directly, so these are a convenience rather than a
    // necessity -- what they add is typed props, `@pf-*` listeners instead of
    // `addEventListener`, and `v-model` on the form controls.
    vueOutputTarget({
      componentCorePackage: '@pitchfork-ui/elements',
      proxiesFile: '../elements-vue/src/components.ts',
      includeImportCustomElements: true,
      // The same six controls the Angular value accessors cover, bound the
      // same way: a checkbox and a switch model their `checked`, everything
      // else its `value`. `pfChange` rather than `pfInput`, because that is
      // the moment a framework should see a new value.
      componentModels: [
        {
          elements: ['pf-input', 'pf-textarea', 'pf-radio-group', 'pf-slider'],
          event: 'pfChange',
          targetAttr: 'value',
        },
        {
          elements: ['pf-checkbox', 'pf-switch'],
          event: 'pfChange',
          targetAttr: 'checked',
        },
      ],
    }),
  ],
  plugins: [
    // The same chain packages/react runs through Vite, so the 32
    // `@media (--sm/--md)` queries and the token alias chain behave
    // identically in both layers.
    postcss({
      plugins: [globalData({ files: [themeCssSource] }), customMedia(), shadowRootReset()],
    }),
  ],
  rollupPlugins: {
    after: [preloadRenderedElements()],
  },
  testing: {
    browserHeadless: 'shell',
  },
  extras: {
    experimentalImportInjection: true,
    addGlobalStyleToComponents: false,
  },
};
