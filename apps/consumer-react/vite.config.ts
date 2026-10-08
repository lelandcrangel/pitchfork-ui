import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Deliberately no alias to the elements source. This app exists to resolve
 * @pitchfork-ui/elements-react the way a consumer does -- through
 * node_modules and the package's own exports map -- because that is the path
 * a source alias hides.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5174 },
});
