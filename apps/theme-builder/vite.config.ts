import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  optimizeDeps: {
    /*
     * The bindings reach `@stencil/core/internal/client` through the runtime
     * rather than through an import Vite's dep scanner can see, so on a cold
     * cache it is discovered mid-run and the page reloads. Declared here,
     * which is what Vite's own warning asks for.
     */
    include: ['@pitchfork-ui/elements-react', '@stencil/core/internal/client'],
  },
  server: { port: 5174 },
});
