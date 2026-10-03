import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * Deliberately no alias to the elements source. This app exists to resolve
 * @pitchfork-ui/elements-vue the way a consumer does -- through node_modules
 * and the package's own exports map -- because that is the path a source
 * alias hides.
 */
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: { port: 5175 },
});
