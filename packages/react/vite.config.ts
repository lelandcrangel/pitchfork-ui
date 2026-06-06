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
    minify: false,
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
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          assetFileNames: 'styles.css',
        },
      ],
    },
  },
});
