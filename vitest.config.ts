import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/*
 * `packages/react` is on its way out, and a `projects` entry naming a file that
 * is not there is a **startup error**, not a skipped project -- measured:
 * `npm run test:docs` died with "Projects definition references a non-existing
 * file or a directory" even though it filters to `--project storybook-smoke`
 * and never runs the React one. Loading the list is what fails.
 *
 * So the entry is conditional. Nothing else here is: a missing config for any
 * other project is a mistake worth failing on.
 */
const reactProject = fileURLToPath(new URL('./packages/react/vitest.config.ts', import.meta.url));

export default defineConfig({
  test: {
    projects: [
      ...(existsSync(reactProject) ? ['./packages/react/vitest.config.ts'] : []),
      './apps/docs/vitest.storybook.config.ts',
      {
        test: {
          name: 'storybook-smoke',
          environment: 'jsdom',
          include: ['apps/docs/src/storybook-project.spec.ts'],
          // The CSS Variables decorator reads the element stylesheets with a
          // `?raw` glob, and Vitest hands back an empty string for any CSS it
          // is not told to process -- measured: 112 files found, every one
          // empty -- so the panel test saw no variables anywhere.
          css: { include: [/packages\/elements\/src\/components\/.+\.css/] },
        },
      },
    ],
  },
});
