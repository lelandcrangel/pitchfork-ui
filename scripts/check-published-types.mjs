#!/usr/bin/env node
/**
 * Validates the type declarations a consumer installs, not the sources CI
 * typechecks. Closes issue #26.
 *
 * `apps/docs/tsconfig.json` resolves `@pitchfork-ui/react` from
 * `packages/react/src` through a `paths` mapping, which is what makes the docs
 * typecheck fast and build-independent -- and what means **nothing in CI reads
 * the emitted `dist/**\/*.d.ts` or the `exports` map a consumer resolves
 * through**. `scripts/fixtures/node16-resolution` closed half of that: it
 * typechecks the built `core` and `react` under `node16` after the build, which
 * caught declarations whose relative specifiers carried no extension. It left
 * the four element packages unchecked, and it cannot see an export map that is
 * merely wrong rather than unresolvable.
 *
 * This runs `attw` from a real `npm pack` of each package, in every module
 * resolution mode. Run it **after a build** -- `npm pack` ships `files`, so with
 * no `dist` the packages are empty and the check is vacuous.
 *
 * **Every exemption here is measured and stated.** An `--ignore-rules` with no
 * reason beside it is how a check turns into cover, which this repository has
 * been bitten by before.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * `tokens` and `mcp` are absent on purpose: neither ships a type declaration.
 * `tokens` is two stylesheets and a JSON file, `mcp` is a stdio server with a
 * `bin`, and `attw` on a package with no types reports every entry point as
 * untyped -- true, and not a regression anyone can introduce.
 */
const PACKAGES = [
  { dir: 'core', profile: 'esm-only' },

  {
    dir: 'react',
    profile: 'esm-only',
    // A stylesheet has no type declaration, and `./metadata` is JSON, which
    // node10 cannot import. Both resolve correctly for what they are.
    exclude: ['./styles.css', './metadata'],
    optional: true, // Phase 7 deletes this package.
  },

  {
    dir: 'elements',
    profile: 'esm-only',
    exclude: ['./styles.css', './metadata'],
    /*
     * The package cannot be `"type": "module"` -- Stencil loads
     * `stencil.config.ts` through `require()` -- so Node reads its `.js` output
     * as CJS while `dist/index.js` holds `export * from './esm/index.js'`.
     * Measured on Node 22.22: the import *works*, because `detect module
     * syntax` reparses it, and costs a `MODULE_TYPELESS_PACKAGE_JSON` warning
     * and one reparse. `attw` calls that an error, which is true of Node before
     * 22.7 and of some bundlers. `todo.md` carries the fix (emit `.mjs`); until
     * then this is a known wart rather than an unknown one.
     */
    ignore: ['unexpected-module-syntax'],
  },

  { dir: 'elements-react', profile: 'esm-only' },

  {
    dir: 'elements-angular',
    profile: 'esm-only',
    /*
     * `ng-packagr` emits a `.d.ts` beside an ESM fesm bundle with no
     * `"type": "module"`, so TypeScript reads CJS types for an ESM module.
     * Every Angular library on npm is shaped this way, and the mode Angular
     * consumers actually resolve through -- bundler -- is green. The wrapper is
     * generated, so "fixing" it would mean deviating from the output target.
     */
    ignore: ['false-cjs'],
  },

  { dir: 'elements-vue', profile: 'esm-only' },
];

const attw = join(ROOT, 'node_modules/.bin/attw');
if (!existsSync(attw)) {
  console.error('attw is not installed — run `npm install` first.');
  process.exit(2);
}

const failures = [];
let checked = 0;

for (const pkg of PACKAGES) {
  const dir = join(ROOT, 'packages', pkg.dir);
  if (!existsSync(dir)) {
    if (pkg.optional) {
      console.log(`  skipped ${pkg.dir} (the package is gone)`);
      continue;
    }
    failures.push(`packages/${pkg.dir} is missing`);
    continue;
  }

  if (!existsSync(join(dir, 'dist'))) {
    console.error(
      `packages/${pkg.dir} has no dist — run \`npm run build\` first, or this check reads an empty package.`,
    );
    process.exit(2);
  }

  const args = ['--pack', dir, '--profile', pkg.profile, '--format', 'ascii', '--no-color'];
  if (pkg.ignore) args.push('--ignore-rules', ...pkg.ignore);
  if (pkg.exclude) args.push('--exclude-entrypoints', ...pkg.exclude);

  checked += 1;
  try {
    execFileSync(attw, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    const notes = [
      pkg.ignore && `ignoring ${pkg.ignore.join(', ')}`,
      pkg.exclude && `excluding ${pkg.exclude.join(', ')}`,
    ].filter(Boolean);
    console.log(`  ${pkg.dir}: types resolve${notes.length ? ` (${notes.join('; ')})` : ''}`);
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    failures.push(`packages/${pkg.dir}:\n${out.replace(/^/gm, '    ')}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} package(s) have problems with their published types:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    '\nEach entry above is a resolution mode a consumer can be in. If one of them is a\n' +
      'deliberate trade, add it to this script with the measurement behind it rather than\n' +
      'widening an ignore.',
  );
  process.exit(1);
}

console.log(`${checked} published package(s): type declarations resolve in every checked mode.`);
