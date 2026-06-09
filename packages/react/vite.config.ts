import globalData from '@csstools/postcss-global-data';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import customMedia from 'postcss-custom-media';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  plugins: [react(), libInjectCss(), dts()],
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
          format: 'cjs',
          entryFileNames: 'index.cjs',
          assetFileNames: 'styles.css',
          banner: "'use client';",
        },
      ],
    },
  },
});
