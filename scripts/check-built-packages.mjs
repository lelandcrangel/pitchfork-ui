#!/usr/bin/env node
/**
 * Checks that only the built output can answer.
 *
 * 1. Every path a package.json advertises exists.
 * 2. Icon's unknown-name warning survived bundling.
 *
 * @pitchfork-ui/react shipped 0.15.1 with `types` pointing at
 * `dist/src/index.d.ts`, a path the build has never produced. Nothing caught
 * it, in either resolution mode, because TypeScript falls back to the `.d.ts`
 * sitting next to the resolved JS -- so a field that named nothing at all
 * looked like it worked. Any tool that reads `types` directly, without that
 * fallback, gets a missing file instead.
 *
 * Run this after building and before publishing.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PACKAGES = ['packages/react', 'packages/tokens', 'packages/mcp'];

/** The fields that name a file consumers will actually resolve. */
const FILE_FIELDS = ['main', 'module', 'types', 'typings', 'bin'];

/**
 * Walk an exports map, which can nest condition objects arbitrarily, and yield
 * every string leaf with the path that led to it.
 */
function* exportPaths(node, trail = 'exports') {
  if (typeof node === 'string') {
    yield [trail, node];
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    yield* exportPaths(value, `${trail}.${key}`);
  }
}

function* declaredPaths(pkg) {
  for (const field of FILE_FIELDS) {
    const value = pkg[field];
    if (typeof value === 'string') yield [field, value];
    // `bin` may be a map of command name -> path.
    else if (field === 'bin' && value && typeof value === 'object') {
      for (const [name, path] of Object.entries(value)) yield [`bin.${name}`, path];
    }
  }
  yield* exportPaths(pkg.exports);
}

let failures = 0;

for (const packageDir of PACKAGES) {
  const packageJsonPath = join(repoRoot, packageDir, 'package.json');
  if (!existsSync(packageJsonPath)) continue;

  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const missing = [];

  for (const [field, declared] of declaredPaths(pkg)) {
    // Wildcard subpath patterns name a shape, not a file.
    if (declared.includes('*')) continue;
    const target = resolve(repoRoot, packageDir, declared);
    if (!existsSync(target)) missing.push({ field, declared });
  }

  if (missing.length > 0) {
    failures += missing.length;
    console.error(`\n${pkg.name}: ${missing.length} declared path(s) do not exist`);
    for (const { field, declared } of missing) {
      console.error(`  ${field} -> ${declared}`);
    }
  } else {
    console.log(`${pkg.name}: every declared path exists`);
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} broken entry point(s). Build the packages first; if they are built, ` +
      'the package.json is pointing somewhere the build does not write.',
  );
  process.exitCode = 1;
}

/**
 * `Icon` renders nothing for a name it does not recognise, so its console
 * warning is the only way a consumer ever finds out. That warning used to sit
 * behind `import.meta.env.DEV`, which the library build replaces with `false` --
 * so it passed every unit test (vitest runs in dev) and was dead-code-eliminated
 * out of the published bundle. Nothing but the built output can catch that.
 */
const DIAGNOSTIC = 'Unknown icon name';
const reactDist = join(repoRoot, 'packages/react/dist');

const bundledFiles = existsSync(reactDist)
  ? (await readdir(reactDist, { recursive: true }))
      .filter((name) => typeof name === 'string' && name.endsWith('.js'))
      .map((name) => join(reactDist, name))
  : [];

let diagnosticFound = false;
for (const file of bundledFiles) {
  if ((await readFile(file, 'utf8')).includes(DIAGNOSTIC)) {
    diagnosticFound = true;
    break;
  }
}

if (bundledFiles.length === 0) {
  console.error('\npackages/react/dist has no JavaScript -- build it first.');
  process.exitCode = 1;
} else if (!diagnosticFound) {
  console.error(
    `\nIcon's "${DIAGNOSTIC}" warning is not in the published bundle. It has ` +
      'been stripped -- most likely put back behind `import.meta.env.DEV`, which ' +
      'is `false` at build time. Consumers would get an empty <span> and no ' +
      'diagnostic anywhere.',
  );
  process.exitCode = 1;
} else {
  console.log("@pitchfork-ui/react: Icon's unknown-name warning survived bundling");
}
