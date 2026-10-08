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
