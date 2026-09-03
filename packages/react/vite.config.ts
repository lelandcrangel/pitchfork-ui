import globalData from '@csstools/postcss-global-data';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import customMedia from 'postcss-custom-media';
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The second rollup output below exists only to produce the monolithic
 * `dist/styles.css` that consumers import (see README). Its single JS chunk is
 * a throwaway duplicate of the ESM build, so drop it before it is written.
 */
const STYLES_ONLY_ENTRY = '.styles-only.js';
const stylesOnlyOutput = (): Plugin => ({
  name: 'pitchfork:styles-only-output',
  generateBundle(options, bundle) {
    if (options.entryFileNames !== STYLES_ONLY_ENTRY) return;
    for (const [fileName, output] of Object.entries(bundle)) {
      if (output.type === 'chunk') delete bundle[fileName];
    }
  },
});

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        globalData({
          files: [resolve(__dirname, 'src/styles/theme.css')],
        }),
        customMedia(),
      ],
    },
  },
  plugins: [react(), libInjectCss(), dts(), stylesOnlyOutput()],
  build: {
    // Keep JS readable so `preserveModules` output stays debuggable; the
    // consumer's bundler minifies it. CSS, however, ships as-is (the monolithic
    // styles.css and every per-component chunk injected by lib-inject-css), so
    // minify it explicitly — `cssMinify` otherwise defaults to `minify`.
    minify: false,
    cssMinify: true,
    cssCodeSplit: true,
    lib: {
      entry: 'src/index.ts',
      name: 'PitchforkUI',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^@fortawesome\//,
        'prism-react-renderer',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          // Mark every chunk as a client module so the library works when imported
          // into React Server Components (e.g. Next.js App Router). The directive
          // must precede all other code, which `banner` guarantees.
          banner: "'use client';",
        },
        {
          // CSS-only pass: one bundled chunk means one CSS asset, which is the
          // `styles.css` consumers import. The chunk itself is removed by
          // `stylesOnlyOutput`. There is no CommonJS build: every known
          // consumer is ESM, and Node 22+ can `require()` ESM directly.
          format: 'es',
          entryFileNames: STYLES_ONLY_ENTRY,
          assetFileNames: 'styles.css',
        },
      ],
    },
  },
});
