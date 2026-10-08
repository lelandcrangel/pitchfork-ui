import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ entryRoot: 'src' })],
  build: {
    minify: false,
    lib: { entry: 'src/index.ts', name: 'PitchforkUIElementsVue', formats: ['es'] },
    rollupOptions: {
      external: [/^vue/, /^@pitchfork-ui\//, /^@stencil\//],
      output: { entryFileNames: '[name].js', preserveModules: true, preserveModulesRoot: 'src' },
    },
  },
});
