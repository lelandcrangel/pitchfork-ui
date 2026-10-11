import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
    }),
  ],
  test: {
    name: 'storybook-dark-a11y',
    browser: {
      enabled: true,
      headless: true,
      // PW_CHROMIUM_PATH, the same way packages/elements' browser project and
      // the three Playwright scripts read it. This was the one entry point
      // that did not, so in an environment whose Chromium does not match
      // Playwright's pinned build it failed with Playwright's own "run npx
      // playwright install" banner -- which points at the wrong cause when the
      // documented variable is already set.
      provider: playwright(
        process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {},
      ),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['./.storybook/vitest-dark-setup.ts'],
  },
});
