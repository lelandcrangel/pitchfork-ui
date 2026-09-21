import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom rather than node: focus trapping, dismissal and anchored
    // positioning are DOM behaviour, and testing them directly is the point of
    // this package existing.
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/index.ts', 'src/internal.ts'],
      reporter: ['text', 'html'],
    },
  },
});
