#!/usr/bin/env node
/**
 * Checks that only the built output can answer.
 *
 * 1. Every path a package.json advertises exists.
 * 2. No ambient type dependency leaked into the published declarations.
 * 3. Icon's unknown-name warning survived bundling.
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
import { builtinModules } from 'node:module';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PACKAGES = [
  'packages/core',
  'packages/elements',
  'packages/elements-react',
  'packages/elements-angular',
  'packages/elements-vue',
  'packages/react',
  'packages/tokens',
  'packages/mcp',
];

const reactDist = join(repoRoot, 'packages/react/dist');

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
 * A `/// <reference types="..." />` in the declarations makes that types
 * package a silent requirement of every consumer. `vite/client` is the live
 * risk here: it supplies `import.meta.env` and the CSS side-effect
 * declarations to this package's own source, but `vite` is a build dependency,
 * not a peer, so a consumer that does not use Vite would fail with "Cannot
 * find type definition file for 'vite/client'".
 *
 * The dts plugin strips these today. This fails the moment it stops, which is
 * not something the repo's own typechecks can see -- `vite` resolves fine from
 * inside the workspace, so even the node16 fixture would pass.
 */
const declarationFiles = existsSync(reactDist)
  ? (await readdir(reactDist, { recursive: true }))
      .filter((name) => typeof name === 'string' && name.endsWith('.d.ts'))
      .map((name) => join(reactDist, name))
  : [];

const REFERENCE = /\/\/\/\s*<reference\s+types=["']([^"']+)["']/g;
const leaked = [];

for (const file of declarationFiles) {
  const contents = await readFile(file, 'utf8');
  for (const [, types] of contents.matchAll(REFERENCE)) {
    leaked.push(`${file.slice(repoRoot.length + 1)} -> ${types}`);
  }
}

if (leaked.length > 0) {
  console.error(
    `\n${leaked.length} ambient type reference(s) leaked into the published ` +
      'declarations. Every consumer would need those types installed:',
  );
  for (const entry of leaked) console.error(`  ${entry}`);
  process.exitCode = 1;
} else if (declarationFiles.length > 0) {
  console.log(
    `@pitchfork-ui/react: no ambient type references in ${declarationFiles.length} declaration files`,
  );
}

/**
 * `Icon` renders nothing for a name it does not recognise, so its console
 * warning is the only way a consumer ever finds out. That warning used to sit
 * behind `import.meta.env.DEV`, which the library build replaces with `false` --
 * so it passed every unit test (vitest runs in dev) and was dead-code-eliminated
 * out of the published bundle. Nothing but the built output can catch that.
 */
const DIAGNOSTIC = 'Unknown icon name';

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

/*
 * The Stencil Angular output target generates one module per value accessor
 * into src/lib/, but public-api.ts is hand-written. So adding a new accessor
 * type to `valueAccessorConfigs` produces a file that nobody exports, and the
 * failure surfaces as "does not provide an export named …" in a consumer —
 * which is how the boolean accessor was first missed.
 */
const angularSrc = join(repoRoot, 'packages/elements-angular/src');
const publicApi = await readFile(join(angularSrc, 'public-api.ts'), 'utf8').catch(() => null);

if (publicApi === null) {
  console.error('\npackages/elements-angular/src/public-api.ts is missing.');
  process.exitCode = 1;
} else {
  const accessors = (await readdir(join(angularSrc, 'lib')).catch(() => [])).filter((name) =>
    name.endsWith('-value-accessor.ts'),
  );
  const unexported = accessors.filter(
    (name) => !publicApi.includes(`./lib/${name.replace(/\.ts$/, '')}`),
  );

  if (accessors.length === 0) {
    console.error(
      '\npackages/elements-angular/src/lib has no value accessors -- ' +
        'run `npm run build:elements` first.',
    );
    process.exitCode = 1;
  } else if (unexported.length > 0) {
    console.error(
      `\n@pitchfork-ui/elements-angular: ${unexported.length} generated value ` +
        `accessor(s) are not exported from public-api.ts:\n` +
        unexported.map((name) => `  ${name}`).join('\n') +
        '\n\nAdd an `export * from` line for each, or an Angular consumer gets ' +
        '"does not provide an export named ..." at runtime.',
    );
    process.exitCode = 1;
  } else {
    console.log(
      `@pitchfork-ui/elements-angular: all ${accessors.length} generated value accessors are exported`,
    );
  }
}

/*
 * Every bare specifier a published bundle imports has to be a package the
 * consumer will actually have. The generated wrapper packages are where this
 * goes wrong, because the specifier is not in anything hand-written: the
 * Stencil output targets emit `import { defineContainer } from
 * '@stencil/<framework>-output-target/runtime'`, and the bundlers here keep
 * `@stencil/*` external. @pitchfork-ui/elements-react declares that runtime as
 * a dependency; @pitchfork-ui/elements-vue was generated the same way and
 * declared nothing, so its published entry point would have failed to resolve
 * on a consumer's first import -- with every build, test and smoke green,
 * because inside the workspace the specifier resolves from the root
 * node_modules whether the package asks for it or not.
 */
const BARE_SPECIFIER =
  /\b(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

/** `@scope/name/deep/path` -> `@scope/name`; `name/deep` -> `name`. */
const packageOf = (specifier) => {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const undeclared = [];

for (const packageDir of PACKAGES) {
  const packageJsonPath = join(repoRoot, packageDir, 'package.json');
  if (!existsSync(packageJsonPath)) continue;

  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const dist = join(repoRoot, packageDir, 'dist');
  if (!existsSync(dist)) continue;

  const allowed = new Set([
    pkg.name,
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);

  const files = (await readdir(dist, { recursive: true })).filter(
    (name) => typeof name === 'string' && (name.endsWith('.js') || name.endsWith('.mjs')),
  );

  for (const name of files) {
    const contents = await readFile(join(dist, name), 'utf8');
    for (const match of contents.matchAll(BARE_SPECIFIER)) {
      const specifier = match[1] ?? match[2];
      if (!specifier || specifier.startsWith('.') || specifier.startsWith('/')) continue;
      if (specifier.startsWith('node:') || builtinModules.includes(specifier)) continue;

      const name = packageOf(specifier);
      if (allowed.has(name)) continue;
      undeclared.push(`${pkg.name} imports ${specifier} (${name} is not declared)`);
    }
  }
}

const uniqueUndeclared = [...new Set(undeclared)];

if (uniqueUndeclared.length > 0) {
  console.error(
    `\n${uniqueUndeclared.length} undeclared runtime dependenc(ies) in the ` +
      'published bundles. Each one resolves inside this workspace and fails for ' +
      'a consumer:',
  );
  for (const entry of uniqueUndeclared) console.error(`  ${entry}`);
  process.exitCode = 1;
} else {
  console.log('every bare specifier in the built bundles is a declared dependency');
}
