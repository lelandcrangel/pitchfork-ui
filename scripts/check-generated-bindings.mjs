#!/usr/bin/env node
/**
 * The typecheck's one prerequisite.
 *
 * `apps/theme-builder` is in the root tsconfig's references and imports
 * `@pitchfork-ui/elements-react`, which resolves only through its `exports`
 * map to `dist/index.d.ts`. That package is *generated*: its
 * `src/components/` is gitignored and its `dist/` has never been committed,
 * so on a clean checkout there is nothing for `tsc` to resolve.
 *
 * Without this guard the failure is 50 errors — eight `TS2307: Cannot find
 * module` and forty-two `TS7006: Parameter 'event' implicitly has an 'any'
 * type` falling out of them — none of which says "run the build first". That
 * is what CI reported on the first run of this branch, and reading it as a
 * type error in the theme builder is the obvious and wrong conclusion.
 *
 * This deliberately refuses rather than building: a `typecheck` that quietly
 * starts a 66-second Stencil build is a worse surprise than one that says
 * which command to run.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Each entry is a file the typecheck resolves and the build that writes it. */
const REQUIRED = [
  {
    file: 'packages/elements-react/dist/index.d.ts',
    reason: 'apps/theme-builder imports @pitchfork-ui/elements-react',
  },
];

const missing = REQUIRED.filter(({ file }) => !existsSync(join(root, file)));

if (missing.length) {
  console.error('Cannot typecheck yet — the generated bindings are not built.\n');
  for (const { file, reason } of missing) {
    console.error(`  missing  ${file}`);
    console.error(`           ${reason}\n`);
  }
  console.error('Build them first:\n');
  console.error('  npm run build:tokens && npm run build:core && npm run build:elements\n');
  console.error(
    'They are generated from packages/elements, so they are gitignored and a\n' +
      'fresh clone never has them. `npm run build` runs everything in order.',
  );
  process.exit(1);
}

if (process.argv.includes('--verbose')) {
  console.log(
    `generated bindings present: ${REQUIRED.map((r) => relative(root, r.file)).join(', ')}`,
  );
}
