import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  // Tests live beside the code they cover; they are not part of the package.
  plugins: [dts({ exclude: ['**/*.test.ts'] })],
  build: {
    // Keep JS readable — the consumer's bundler minifies it. Matches
    // packages/react, which ships unminified for the same reason.
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: 'PitchforkUICore',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
