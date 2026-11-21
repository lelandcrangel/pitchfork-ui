#!/usr/bin/env node
/**
 * Tells Node which of the elements' built `.js` files are ES modules.
 *
 * The package cannot be `"type": "module"`, because Stencil loads
 * `stencil.config.ts` through `require()`. So Node reads every `.js` file in it
 * as CommonJS, and the ESM ones (`dist/index.js`, the loader and everything in
 * `dist/esm` and `dist/components`) only load because Node 22.7+ notices the
 * syntax, warns `MODULE_TYPELESS_PACKAGE_JSON`, and parses each file a second
 * time. Older Node fails on them outright, and `attw` reports every ESM
 * resolution mode as an error.
 *
 * Two kinds of fix, depending on what shares the folder:
 *
 * - A folder holding only ES modules gets a `package.json` that says
 *   `"type": "module"`. Node takes a file's module type from the nearest
 *   `package.json`, so this covers every chunk in it, the hundreds the lazy
 *   build splits out as well as the entry point.
 * - An entry point that sits beside its CommonJS twin (`index.js` next to
 *   `index.cjs.js`) cannot share a folder marker with it, so it gets an
 *   `.mjs` copy, and the `exports` map points `import` at that copy.
 *
 * The copies are made from Stencil's own output rather than written out here,
 * so they cannot drift from what Stencil emits. The `.js` originals stay: the
 * `module` field and any bundler that reads it still point at them.
 *
 * Runs after `stencil build`, which empties `dist` and rewrites `loader`.
 */

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ELEMENTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'elements');

// Folders that hold nothing but ES modules.
const ESM_FOLDERS = ['dist/esm', 'dist/components', 'dist/collection'];

// ESM entry points that sit beside a CommonJS twin.
const ESM_ENTRIES = [
  ['dist/index.js', 'dist/index.mjs'],
  ['loader/index.js', 'loader/index.mjs'],
];

/*
 * A bundler reads `sideEffects` from the nearest `package.json` too, and a
 * marker without the field means "every file has side effects". That kept all
 * 112 element modules in a one-badge Angular app (110 KB where the element
 * alone is 7.4), because esbuild stopped seeing the parent's list, which
 * leaves `dist/components` out on purpose. So each marker repeats the
 * parent's answer for its folder, read from the parent rather than restated.
 */
const parentSideEffects = JSON.parse(
  readFileSync(join(ELEMENTS, 'package.json'), 'utf8'),
).sideEffects;
if (!Array.isArray(parentSideEffects)) {
  throw new Error(
    'mark-elements-esm: expected a sideEffects list in packages/elements/package.json',
  );
}

for (const folder of ESM_FOLDERS) {
  const path = join(ELEMENTS, folder);
  if (!existsSync(path)) {
    throw new Error(`mark-elements-esm: ${folder} was not built; run stencil build first`);
  }
  const sideEffects = parentSideEffects.includes(`./${folder}/**`);
  writeFileSync(
    join(path, 'package.json'),
    `${JSON.stringify({ type: 'module', sideEffects }, null, 2)}\n`,
  );
}

for (const [from, to] of ESM_ENTRIES) {
  const source = join(ELEMENTS, from);
  if (!existsSync(source)) {
    throw new Error(`mark-elements-esm: ${from} was not built; run stencil build first`);
  }
  // A relative import in the copy resolves exactly as it did from the original,
  // because the copy sits in the same folder. Refuse anything that is not ESM,
  // so a change in Stencil's output cannot quietly give the import condition a
  // CommonJS file.
  if (!/^\s*export\s/m.test(readFileSync(source, 'utf8'))) {
    throw new Error(`mark-elements-esm: ${from} is not an ES module any more`);
  }
  copyFileSync(source, join(ELEMENTS, to));
}

/*
 * The declarations have to agree with the JavaScript, or TypeScript reads
 * ESM code through CommonJS types (attw's "masquerading as CJS").
 *
 * Stencil writes extensionless relative imports in its declarations
 * (`'../types'`, `'../types/components'`). That only resolves while TypeScript
 * reads a file as CommonJS; in ESM mode a relative import needs its full path.
 * So:
 *
 * - `dist/types` stays CommonJS-format, which is what the `require` condition
 *   and node10 read, and is left exactly as Stencil wrote it.
 * - Each ESM entry gets a `.d.mts` beside its `.mjs`. ESM may import CommonJS
 *   types, so it re-exports the same `dist/types` tree rather than copying it.
 * - The declarations inside `dist/components`, a folder now marked as ESM,
 *   get each relative import rewritten to the file it names.
 */
function explicitSpecifier(fromFile, specifier) {
  const base = join(dirname(fromFile), specifier);
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier}/index.js`;
  throw new Error(`mark-elements-esm: ${specifier} in ${fromFile} names no declaration file`);
}

function withExplicitSpecifiers(file) {
  return readFileSync(file, 'utf8').replace(
    /(from\s+|import\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g,
    (match, lead, quote, specifier) =>
      /\.(js|mjs|cjs)$/.test(specifier)
        ? match
        : `${lead}${quote}${explicitSpecifier(file, specifier)}${quote}`,
  );
}

let rewritten = 0;
const componentsDir = join(ELEMENTS, 'dist/components');
for (const name of readdirSync(componentsDir)) {
  if (!name.endsWith('.d.ts')) continue;
  const file = join(componentsDir, name);
  const before = readFileSync(file, 'utf8');
  const after = withExplicitSpecifiers(file);
  if (after !== before) {
    writeFileSync(file, after);
    rewritten += 1;
  }
}

writeFileSync(join(ELEMENTS, 'dist/index.d.mts'), "export * from './types/index.js';\n");
writeFileSync(
  join(ELEMENTS, 'loader/index.d.mts'),
  withExplicitSpecifiers(join(ELEMENTS, 'loader/index.d.ts')),
);

console.log(
  `mark-elements-esm: ${ESM_FOLDERS.length} folders marked as ES modules, ` +
    `${ESM_ENTRIES.length} entry points copied to .mjs with .d.mts beside them, ` +
    `${rewritten} declarations given explicit import paths`,
);
