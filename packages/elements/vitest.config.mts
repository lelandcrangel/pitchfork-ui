import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

/**
 * Stencil's own `stencil test` runner is deprecated and is removed in Stencil 5,
 * so spec tests run on Vitest -- which is what the rest of this workspace uses
 * anyway.
 *
 * `stencilVitestPlugin` compiles the component sources on the fly (decorators
 * and all) and `environment: 'stencil'` supplies the DOM those components need.
 *
 * `.mts` because this package is not `"type": "module"` -- Stencil loads
 * stencil.config.ts through require(), which breaks if it is -- and the config
 * helper is ESM-only.
 */
export default defineVitestConfig({
  plugins: [stencilVitestPlugin()],
  test: {
    environment: 'stencil',
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
