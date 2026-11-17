import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/*
 * `@stencil/react-output-target` is bundled, not depended on. The generated
 * bindings import only its `/runtime` entry (a few hundred lines over
 * `@lit/react`), but the package also carries the build-time half, which
 * depends on `ts-morph` -- and a dependency installs all of it. Every
 * consumer of this package was receiving ts-morph, @ts-morph/common,
 * tinyglobby, picomatch, minimatch and glob for code their app never loads,
 * and with them GHSA-fc5q-39xc-vjpf, which has no fix. Bundling the runtime
 * removes the whole chain from what a consumer installs.
 *
 * It lands under `vendor/` rather than `node_modules/`, because npm never
 * packs a directory named `node_modules`. Its types are copied beside it by
 * scripts/vendor-react-runtime-types.mjs.
 */
const BUNDLED = /^@stencil\/react-output-target(\/|$)/;

export default defineConfig({
  plugins: [dts({ entryRoot: 'src' })],
  build: {
    minify: false,
    lib: { entry: 'src/index.ts', name: 'PitchforkUIElementsReact', formats: ['es'] },
    rollupOptions: {
      external: (id) =>
        !BUNDLED.test(id) &&
        [/^react/, /^@pitchfork-ui\//, /^@stencil\//, /^@lit\//].some((re) => re.test(id)),
      output: {
        entryFileNames: (chunk) => `${chunk.name.replace(/(^|\/)node_modules\//g, '$1vendor/')}.js`,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
