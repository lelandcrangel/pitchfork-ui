import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      './packages/react/vitest.config.ts',
      './apps/docs/vitest.storybook.config.ts',
      {
        test: {
          name: 'storybook-smoke',
          environment: 'jsdom',
          include: ['apps/docs/src/storybook-project.spec.ts'],
        },
      },
    ],
  },
});
