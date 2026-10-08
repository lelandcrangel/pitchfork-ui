/*
 * A timezone with daylight saving, set before the workers fork so `Date`
 * picks it up.
 *
 * The default here is UTC, which has no DST at all — and that hides a whole
 * class of date defect. Measured: swapping `date.ts`'s midday-pinned
 * `addDays` for a millisecond offset makes `buildHeatmapWeeks` lose a day
 * across the spring-forward Sunday, which fails under `America/New_York` and
 * passes under UTC. Every test in this package passes under both.
 */
process.env.TZ = 'America/New_York';

import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Run against core's source rather than its dist, so `npm run test` works
    // on a fresh clone without building another package first.
    alias: {
      '@pitchfork-ui/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/test/**', 'src/**/index.ts', 'src/components/.template/**'],
      reporter: ['text', 'html'],
    },
  },
});
