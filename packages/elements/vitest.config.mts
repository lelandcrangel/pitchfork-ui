import { playwright } from '@vitest/browser-playwright';
import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

/**
 * Two projects, because the two kinds of test need different DOMs.
 *
 * `unit` runs on Stencil's own environment: fast, and enough for markup,
 * reflected props, parts and events.
 *
 * `browser` runs in Chromium, because form-associated custom elements cannot
 * be tested anywhere else. Stencil's mock DOM stubs ElementInternals, and
 * jsdom 30 provides `attachInternals()` but neither `setFormValue` nor
 * `setValidity`.
 *
 * `.mts` because this package is not `"type": "module"` -- Stencil loads
 * stencil.config.ts through require(), which breaks if it is.
 */
export default defineVitestConfig({
  plugins: [stencilVitestPlugin()],
  test: {
    projects: [
      {
        plugins: [stencilVitestPlugin()],
        test: {
          name: 'unit',
          environment: 'stencil',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: ['src/**/*.browser.spec.{ts,tsx}'],
        },
      },
      {
        plugins: [stencilVitestPlugin()],
        test: {
          name: 'browser',
          include: ['src/**/*.browser.spec.{ts,tsx}'],
          browser: {
            enabled: true,
            // PW_CHROMIUM_PATH lets an environment point at a Chromium it
            // already has, when the build Playwright wants cannot be downloaded.
            provider: playwright(
              process.env.PW_CHROMIUM_PATH
                ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
                : {},
            ),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
