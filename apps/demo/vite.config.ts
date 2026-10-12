import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/pitchfork-ui/demo/' : '/',
  optimizeDeps: {
    /*
     * The bindings reach `@stencil/core/internal/client` through the runtime
     * rather than through an import Vite's dep scanner can see, so on a cold
     * cache it is discovered mid-run and the page reloads. Declared here, which
     * is what Vite's own warning asks for -- the same line
     * `packages/elements/vitest.config.mts` carries for its browser project.
     */
    include: ['@pitchfork-ui/elements-react', '@stencil/core/internal/client'],
  },
  server: {
    port: 5173,
  },
}));
