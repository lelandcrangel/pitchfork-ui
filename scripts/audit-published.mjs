#!/usr/bin/env node
/*
 * The security audit for what a consumer actually installs.
 *
 * CI used to answer that with `npm audit --omit=dev` at the workspace root.
 * In a workspace that is a wider question than it reads: every app under
 * `apps/` is a workspace, so the consumer test apps, Storybook and their
 * toolchains count as production dependencies of the root. It passed only
 * because nothing in that wider set had a high advisory -- until
 * GHSA-fc5q-39xc-vjpf was widened (2026-11-17) to every `picomatch` release,
 * with no patched version, reaching the root through `vite`, `@angular/cli`
 * and Storybook and through no published package at all. A blocking step that
 * goes red for a dependency no consumer can receive is a step that teaches
 * people to ignore it.
 *
 * So this walks the lockfile from each published package's own runtime
 * dependencies (`dependencies` and `optionalDependencies`, resolved the way
 * Node resolves them, following workspace links) and fails only on a high or
 * critical advisory inside that set. Peer dependencies are left out: the
 * consumer chooses those versions, not this repository. Everything outside the
 * set is still printed, so it stays visible; the whole-tree audit in CI keeps
 * reporting it too.
 *
 * Usage: node scripts/audit-published.mjs [--level high|critical|moderate|low]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

/*
 * Advisories accepted for a stated reason, each with an expiry it checks for
 * itself: the exception fails the moment the advisory's own package publishes
 * a version outside the vulnerable range, so it cannot outlive its reason.
 * Nothing goes here without the dependency chain and why it cannot run.
 */
const ACCEPTED = [
  // Empty. GHSA-fc5q-39xc-vjpf (picomatch, no fix) reached
  // @pitchfork-ui/elements-react through @stencil/react-output-target ->
  // ts-morph; that package now bundles the output target's runtime instead of
  // depending on it, which took the whole chain out of what a consumer installs.
  // Entry shape: { id: 'GHSA-…', package: 'name', reason: 'the chain, and why it cannot run' }.
];

/** Whether `name` has published a version outside `range` -- a fix to take. */
function fixPublished(name, range) {
  const latest = execFileSync('npm', ['view', name, 'version'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const vulnerable = execFileSync('npm', ['view', `${name}@${range}`, 'version', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  const versions = vulnerable.trim() ? [].concat(JSON.parse(vulnerable)) : [];
  return versions.includes(latest) ? null : latest;
}

const levelArg = process.argv.indexOf('--level');
const level = levelArg === -1 ? 'high' : process.argv[levelArg + 1];
if (!(level in RANK)) throw new Error(`--level must be one of ${Object.keys(RANK).join(', ')}`);

const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages;
const published = Object.keys(
  JSON.parse(fs.readFileSync(path.join(root, 'release-please-config.json'), 'utf8')).packages,
);

/** Where `name` resolves from the package installed at `from`, as Node would look. */
function resolve(name, from) {
  let dir = from;
  for (;;) {
    const candidate = dir ? `${dir}/node_modules/${name}` : `node_modules/${name}`;
    if (lock[candidate]) return candidate;
    if (!dir) return null;
    const cut = dir.lastIndexOf('/node_modules/');
    dir = cut === -1 ? '' : dir.slice(0, cut);
  }
}

/** Follows a workspace link to the package it points at. */
const follow = (location) => (lock[location]?.link ? lock[location].resolved : location);

const closure = new Map(); // lockfile location -> the published package that reaches it
const queue = published.filter((dir) => lock[dir]).map((dir) => [dir, dir]);
const seen = new Set();

while (queue.length > 0) {
  const [location, via] = queue.shift();
  if (seen.has(location)) continue;
  seen.add(location);
  closure.set(location, via);

  const entry = lock[location];
  const deps = { ...entry.dependencies, ...entry.optionalDependencies };
  for (const name of Object.keys(deps)) {
    const found = resolve(name, location);
    if (!found) {
      // An optional dependency for another platform is legitimately absent.
      if (entry.optionalDependencies?.[name]) continue;
      throw new Error(`${location} depends on ${name}, which the lockfile does not resolve`);
    }
    queue.push([follow(found), via]);
    if (found !== follow(found)) closure.set(found, via);
  }
}

let report;
try {
  report = execFileSync('npm', ['audit', '--json'], { cwd: root, encoding: 'utf8' });
} catch (error) {
  // `npm audit` exits non-zero whenever it finds anything; the JSON is still on stdout.
  report = error.stdout;
}
const vulnerabilities = JSON.parse(report).vulnerabilities ?? {};

const blocking = [];
const elsewhere = [];
const accepted = [];
const expired = [];
for (const [name, vuln] of Object.entries(vulnerabilities)) {
  if (RANK[vuln.severity] < RANK[level]) continue;
  // Only the package's own advisories: a parent listed "via" a child is the
  // child's problem, and the child has its own entry.
  const advisories = vuln.via.filter((v) => typeof v === 'object');
  if (advisories.length === 0) continue;
  const reached = vuln.nodes.filter((node) => closure.has(node));
  const line = `${name} (${vuln.severity}): ${advisories.map((a) => a.url).join(', ')}`;
  if (reached.length > 0) {
    const from = [...new Set(reached.map((node) => closure.get(node)))].join(', ');
    const ids = advisories.map((a) => a.url.split('/').pop());
    const exception = ACCEPTED.find((a) => a.package === name && ids.every((id) => id === a.id));
    if (!exception) {
      blocking.push(`${line}\n    reached from ${from}`);
      continue;
    }
    const fixed = fixPublished(name, advisories[0].range);
    if (fixed)
      expired.push(
        `${name} ${fixed} is outside ${advisories[0].range}: take it and delete the exception for ${exception.id}`,
      );
    else accepted.push(`${line}\n    reached from ${from}\n    accepted: ${exception.reason}`);
  } else {
    elsewhere.push(line);
  }
}

if (elsewhere.length > 0) {
  console.log(
    `${elsewhere.length} ${level}+ advisor${elsewhere.length === 1 ? 'y' : 'ies'} in the workspace that no published package reaches (apps, tooling):\n` +
      elsewhere.map((l) => `  ${l}`).join('\n'),
  );
}

if (accepted.length > 0) {
  console.log(
    `\n${accepted.length} accepted advisor${accepted.length === 1 ? 'y' : 'ies'}, each until a fix is published:\n` +
      accepted.map((l) => `  ${l}`).join('\n'),
  );
}

if (expired.length > 0) {
  console.error(
    `\nAn accepted advisory has a fix now:\n${expired.map((l) => `  ${l}`).join('\n')}`,
  );
  process.exit(1);
}

if (blocking.length > 0) {
  console.error(
    `\n${blocking.length} ${level}+ advisor${blocking.length === 1 ? 'y reaches' : 'ies reach'} what a consumer installs:\n` +
      blocking.map((l) => `  ${l}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `\naudit-published: no ${level}+ advisory in the ${closure.size} packages the ${published.length} published packages install.`,
);
