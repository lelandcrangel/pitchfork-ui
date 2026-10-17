#!/usr/bin/env node
/**
 * Two things the documentation can be wrong about without anything noticing.
 *
 *   node scripts/check-docs.mjs
 *
 * **1. A package subpath that is not exported.** `WebComponents.mdx` told
 * every reader to load the token stylesheet with
 * `import '@pitchfork-ui/elements/dist/pitchfork/pitchfork.css'`. That file is
 * real, it is in the published tarball, and the import **cannot resolve** --
 * the package has an `exports` map, so a subpath the map does not name is
 * blocked (`ERR_PACKAGE_PATH_NOT_EXPORTED`, measured). The exported name is
 * `./styles.css`, which maps to the same file. Nothing here could have caught
 * it: the page builds, the snippet is prose, and the workspace's own apps
 * import the exported name.
 *
 * So every `@pitchfork-ui/*` **subpath** named in a documentation page or a
 * published README is checked against its package's own `exports` map. The map
 * is read rather than `require.resolve` called, because the answer has to be
 * the same on a clean checkout: half of these targets are build output, and a
 * resolver cannot tell "not part of the public API" from "not built yet".
 *
 * A bare package name is not checked, deliberately. It appears in prose all
 * over these pages, and `@pitchfork-ui/tokens` has no `.` export at all -- it
 * is two stylesheets and a JSON file, with nothing to import by the bare name.
 *
 * **2. A window promised and never stated.** Four surfaces said
 * `@pitchfork-ui/react` would be removed "after a stated window" and no
 * surface stated it: the date lived in `deprecate-react.mjs`, where it reached
 * npm's deprecation notice and nothing else. The generators read
 * `lib/retirement.mjs` now; the two hand-written pages cannot, so the date is
 * typed there and asserted here.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { WINDOW_ENDS } from './lib/retirement.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = '@pitchfork-ui';

const problems = [];

// ---------------------------------------------------------------------------
// The workspace's own packages, by published name.
// ---------------------------------------------------------------------------

const packages = new Map();
for (const entry of readdirSync(join(ROOT, 'packages'))) {
  const manifest = join(ROOT, 'packages', entry, 'package.json');
  if (!existsSync(manifest)) continue;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  packages.set(pkg.name, pkg);
}

/** Does `exports` name this subpath, directly or through a `*` pattern? */
function exportsSubpath(exportsField, subpath) {
  if (exportsField === undefined || typeof exportsField !== 'object') return false;
  const key = `./${subpath}`;
  for (const pattern of Object.keys(exportsField)) {
    if (pattern === key) return true;
    if (!pattern.includes('*')) continue;
    const [before, after] = pattern.split('*');
    if (key.startsWith(before) && key.endsWith(after) && key.length >= before.length + after.length)
      return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 1. Every documented subpath is an exported one.
// ---------------------------------------------------------------------------

/** Documentation a reader meets: the site's prose, and the published READMEs. */
function documentationFiles() {
  const files = [join(ROOT, 'README.md')];
  for (const entry of readdirSync(join(ROOT, 'apps/docs/src'))) {
    if (entry.endsWith('.mdx')) files.push(join(ROOT, 'apps/docs/src', entry));
  }
  for (const entry of readdirSync(join(ROOT, 'packages'))) {
    const readme = join(ROOT, 'packages', entry, 'README.md');
    if (existsSync(readme)) files.push(readme);
  }
  return files.filter((file) => existsSync(file));
}

/*
 * `node_modules/` in front of a match makes it a filesystem path rather than a
 * specifier -- `UsingWithAI.mdx` passes one to the MCP server on a command
 * line, where deep paths are exactly right.
 */
const SPECIFIER = new RegExp(
  `(?<prefix>node_modules/)?${SCOPE}/(?<pkg>[a-z][a-z0-9-]*)(?<subpath>(?:/[A-Za-z0-9._-]+)*)`,
  'g',
);

let checked = 0;

for (const file of documentationFiles()) {
  const relative = file.slice(ROOT.length + 1);
  for (const match of readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
    const { prefix, pkg, subpath } = match.groups;
    if (prefix) continue;

    const name = `${SCOPE}/${pkg}`;
    const manifest = packages.get(name);
    if (!manifest) {
      problems.push(`${relative} names \`${name}\`, which is not a package in this workspace.`);
      continue;
    }
    if (!subpath) continue; // a bare name in prose -- see the header

    checked += 1;
    if (!exportsSubpath(manifest.exports, subpath.slice(1))) {
      problems.push(
        `${relative} names \`${name}${subpath}\`, which ${name}'s \`exports\` map does not ` +
          'define — an import of it fails with ERR_PACKAGE_PATH_NOT_EXPORTED. ' +
          `Exported subpaths: ${Object.keys(manifest.exports ?? {}).join(', ') || 'none'}.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. The retirement window is stated where it is promised.
// ---------------------------------------------------------------------------

const MUST_STATE_WINDOW = [
  'apps/docs/src/Introduction.mdx',
  'apps/docs/src/WebComponents.mdx',
  'apps/docs/src/Migrating.mdx',
];

for (const relative of MUST_STATE_WINDOW) {
  const file = join(ROOT, relative);
  if (!existsSync(file)) continue; // Phase 7 took the page with the package.
  if (!readFileSync(file, 'utf8').includes(WINDOW_ENDS)) {
    problems.push(
      `${relative} promises that @pitchfork-ui/react is removed but does not say when. ` +
        `The window ends ${WINDOW_ENDS} (scripts/lib/retirement.mjs).`,
    );
  }
}

for (const file of documentationFiles()) {
  const text = readFileSync(file, 'utf8');
  if (/\ba stated window\b/.test(text)) {
    problems.push(
      `${file.slice(ROOT.length + 1)} says "a stated window" — state it (${WINDOW_ENDS}).`,
    );
  }
}

// ---------------------------------------------------------------------------

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in the documentation:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `${checked} documented package subpath(s) are exported, and the retirement window ` +
    `(${WINDOW_ENDS}) is stated on every page that promises one.`,
);
