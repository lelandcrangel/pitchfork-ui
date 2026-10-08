import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * The Angular bindings are tested in Chromium, for two reasons: pf-input is
 * form-associated and needs a real ElementInternals, and proving a
 * ControlValueAccessor works at all means running Angular, not type-checking it.
 */
export default defineConfig({
  // Angular needs its own compiler in the Vite pipeline: decorators in the
  // generated proxies, and the linker for the partial-Ivy library output.
  plugins: [angular()],
  test: {
    include: ['test/**/*.spec.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        process.env.PW_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
          : {},
      ),
      instances: [{ browser: 'chromium' }],
    },
  },
});
