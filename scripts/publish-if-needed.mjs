#!/usr/bin/env node
/**
 * Publish one workspace, unless that exact version is already on the registry.
 *
 * The publish job runs eight `npm publish` steps in dependency order and stops
 * at the first failure, so a run that gets part-way leaves the rest
 * unpublished — and then **cannot be re-run**, because the packages that did
 * go out now fail with "You cannot publish over the previously published
 * versions". That happened on the first real release: `tokens@0.5.0`
 * published, `core@0.2.0` was refused for want of a trusted publisher, and the
 * re-run died on tokens without ever reaching core again. A partial publish
 * wedged the job permanently, and the only way forward was by hand.
 *
 * Skipping an already-published version makes the job resumable, which is the
 * property a multi-package publish needs: fix whatever broke, press re-run,
 * and it carries on from where it stopped.
 *
 * It is deliberately loud about which branch it took. A script that decides
 * whether to publish is exactly the kind that can silently publish nothing, so
 * every run prints the version it found and the decision it made.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = process.argv[2];
if (!pkg) {
  console.error('usage: publish-if-needed.mjs <workspace-name-without-scope>');
  process.exit(1);
}

const name = `@pitchfork-ui/${pkg}`;
const version = JSON.parse(readFileSync(`packages/${pkg}/package.json`, 'utf8')).version;

let published = [];
const response = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}`);
if (response.ok) {
  published = Object.keys((await response.json()).versions ?? {});
} else if (response.status === 404) {
  // Not on the registry at all. Trusted publishing cannot create a package,
  // so this will fail — but it fails with npm's own message, which says more
  // than anything this script could invent.
  console.log(`${name}: not on the registry yet.`);
} else {
  console.error(`${name}: the registry answered ${response.status}; not guessing. Failing.`);
  process.exit(1);
}

if (published.includes(version)) {
  console.log(`${name}@${version} is already published — skipping.`);
  process.exit(0);
}

console.log(
  `${name}@${version} is not published (registry has: ${published.join(', ') || 'nothing'}). Publishing.`,
);
execFileSync('npm', ['publish', '--workspace', name, '--access', 'public'], { stdio: 'inherit' });
