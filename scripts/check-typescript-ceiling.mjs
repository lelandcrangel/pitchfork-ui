#!/usr/bin/env node
/**
 * Says when the `typescript` ignore in `.github/dependabot.yml` can come out.
 *
 *   node scripts/check-typescript-ceiling.mjs
 *
 * The ignore exists because `typescript-eslint` peers `typescript >=4.8.4
 * <6.1.0` and `@angular/compiler-cli@21` peers `>=5.9 <6.1`, so Dependabot's
 * bump to 7.x opens a PR that cannot install. An ignore with no expiry is a
 * `// TODO` in a config file, and this is its expiry: it **fails once the
 * ignore is no longer needed**, which is the one moment anybody wants to hear
 * about it.
 *
 * Three decisions worth knowing:
 *
 *   - **The range comes out of `dependabot.yml`, not out of this file.** A
 *     check that hard-codes the version it is asking about is a second place
 *     to edit, and the one that gets forgotten is always the check.
 *   - **npm answers the semver questions, so there is no semver dependency.**
 *     `npm view "typescript@<range>" version` resolves a range against the
 *     registry's real version list, so "does this peer range accept 7.0.2?" is
 *     "is 7.0.2 in that answer?". The alternative is implementing `satisfies`
 *     over `||` and `^` by hand, which is the sort of code that is wrong in one
 *     corner for a year.
 *   - **It asks about every installed package that peers `typescript`, not
 *     just the two direct offenders.** `rollup-plugin-dts` peers `^4.5 || ^5.0
 *     || ^6.0` and reaches the tree through `ng-packagr`, so a check that
 *     looked only at direct dependencies would sound the all-clear while it
 *     still capped the install. The answer for a transitive package is
 *     necessarily about its own latest release rather than about the version
 *     its parent pins, so a green run means "try lifting it", not "guaranteed
 *     to resolve" -- and trying it is one `npm install`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = 'typescript';

/** `npm view`, returning `null` for anything the registry has no answer for. */
function view(spec, field) {
  try {
    const out = execFileSync('npm', ['view', spec, field, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
    return out === '' ? null : JSON.parse(out);
  } catch {
    return null;
  }
}

/** Every version of `typescript` the registry offers for `range`. */
function versionsMatching(range) {
  const answer = view(`${PACKAGE}@${range}`, 'version');
  if (answer === null) return [];
  return Array.isArray(answer) ? answer : [answer];
}

// ---------------------------------------------------------------------------
// 1. What is being ignored, according to the config itself.
// ---------------------------------------------------------------------------

const configPath = join(ROOT, '.github/dependabot.yml');
const config = readFileSync(configPath, 'utf8');
const ignored = /dependency-name:\s*'typescript'\s*\n\s*versions:\s*\['([^']+)'\]/.exec(config);

if (!ignored) {
  /*
   * Red rather than green, for the same reason the all-clear below is: a
   * weekly green run saying "delete me" is a weekly run nobody reads.
   */
  console.error(
    `${PACKAGE} is not ignored in .github/dependabot.yml, so this check has ` +
      'nothing to watch — delete it, and its workflow, along with the ignore.',
  );
  process.exit(1);
}

const ignoredRange = ignored[1];

// ---------------------------------------------------------------------------
// 2. Is the ignore still skipping anything?
// ---------------------------------------------------------------------------

const latest = view(`${PACKAGE}@latest`, 'version');
if (typeof latest !== 'string') {
  console.error(`Could not ask the registry for the latest ${PACKAGE}.`);
  process.exit(2);
}

if (!versionsMatching(ignoredRange).includes(latest)) {
  console.error(
    `${PACKAGE}@${latest} is outside the ignored range \`${ignoredRange}\`, so the ignore ` +
      'is skipping nothing.\n' +
      `Remove it from ${configPath} — and this check with it.`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Who in the installed tree still refuses it?
// ---------------------------------------------------------------------------

const modules = join(ROOT, 'node_modules');
if (!existsSync(modules)) {
  console.error('node_modules is not here — run `npm install` first.');
  process.exit(2);
}

/** Installed package names declaring a `typescript` peer, scopes included. */
function installedPeers() {
  const names = new Set();
  const read = (dir, name) => {
    const manifest = join(dir, 'package.json');
    if (!existsSync(manifest)) return;
    try {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      if (pkg.peerDependencies?.[PACKAGE]) names.add(pkg.name ?? name);
    } catch {
      /* A half-written manifest in node_modules is not this check's problem. */
    }
  };

  for (const entry of readdirSync(modules)) {
    if (entry.startsWith('.')) continue;
    if (entry.startsWith('@')) {
      const scope = join(modules, entry);
      for (const inner of readdirSync(scope)) read(join(scope, inner), `${entry}/${inner}`);
      continue;
    }
    read(join(modules, entry), entry);
  }
  return [...names].sort();
}

const accepts = new Map(); // peer range -> whether it accepts `latest`
const blocking = [];

for (const name of installedPeers()) {
  const range = view(`${name}@latest`, `peerDependencies.${PACKAGE}`);
  if (typeof range !== 'string') continue; // its latest no longer peers TypeScript

  if (!accepts.has(range)) accepts.set(range, versionsMatching(range).includes(latest));
  if (!accepts.get(range)) blocking.push({ name, range });
}

if (blocking.length > 0) {
  console.log(`${PACKAGE}@${latest} is still refused by ${blocking.length} package(s):`);
  for (const { name, range } of blocking) console.log(`  ${name}@latest peers ${PACKAGE} ${range}`);
  console.log(`\nThe \`${ignoredRange}\` ignore in ${configPath} is still earning its place.`);
  process.exit(0);
}

console.error(
  `Every installed package that peers ${PACKAGE} now has a release accepting ` +
    `${PACKAGE}@${latest}.\n` +
    `Remove the \`${ignoredRange}\` ignore from ${configPath}, let Dependabot open the bump, ` +
    'and delete this check and .github/workflows/typescript-ceiling.yml.',
);
process.exit(1);
