#!/usr/bin/env node
/**
 * Checks that every workspace dependency a publishable package declares can
 * actually be installed from the registry.
 *
 * `check-built-packages.mjs` asks whether every bare import is *declared*.
 * This asks the next question, which is not the same one: whether a declared
 * workspace sibling is *published*. The two come apart exactly once, and it is
 * the expensive once -- `@pitchfork-ui/react` gained
 * `"@pitchfork-ui/core": "^0.1.0"` in the core extraction while
 * `@pitchfork-ui/core` has never been published, so the first React release
 * after that branch lands would ship a dependency npm cannot resolve. Every
 * test, build and smoke passes, because inside the workspace the sibling is
 * right there on disk.
 *
 * The release workflow already publishes tokens -> core -> react in order, so
 * it is safe when release-please cuts all three. The hole is a release that
 * cuts react alone: the core publish step is skipped and react goes out
 * against a registry that has never heard of it. Hence `--publishing`, which
 * the workflow fills in from release-please's own `*_released` outputs, so a
 * sibling shipping in the same run counts as satisfied.
 *
 *   node scripts/check-publishable.mjs
 *   node scripts/check-publishable.mjs --publishing core,react
 *
 * Reads the registry, so it needs network. A registry that cannot be reached
 * is reported and skipped rather than failed: this guards a real mistake, and
 * turning a transient outage into a red build would only teach people to
 * ignore it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(root, 'packages');

const publishing = new Set(
  (process.argv.find((arg) => arg.startsWith('--publishing='))?.split('=')[1] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (name.startsWith('@') ? name : `@pitchfork-ui/${name}`)),
);

/** Every workspace package, by name. */
const workspace = new Map();
for (const entry of readdirSync(packagesDir)) {
  const manifest = join(packagesDir, entry, 'package.json');
  if (!existsSync(manifest)) continue;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  workspace.set(pkg.name, { dir: entry, pkg });
}

/** The dependency fields a consumer actually installs. `devDependencies` is not one. */
const INSTALLED_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

const siblingDeps = ({ pkg }) => {
  const found = [];
  for (const field of INSTALLED_FIELDS) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      if (workspace.has(name)) found.push({ name, range, field });
    }
  }
  return found;
};

/** Published versions of a package, `null` when the registry could not answer. */
const versionCache = new Map();
function publishedVersions(name) {
  if (versionCache.has(name)) return versionCache.get(name);

  let result;
  try {
    const out = execFileSync('npm', ['view', name, 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(out);
    result = Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    // npm masks an unpublished package as E404. Anything else -- no network, a
    // proxy, an auth failure -- is "cannot tell", which is not the same answer.
    result = /E404|404 Not Found/.test(String(error.stdout) + String(error.stderr)) ? [] : null;
  }

  versionCache.set(name, result);
  return result;
}

/** Publish order: a package after every workspace sibling it depends on. */
function publishOrder() {
  const ordered = [];
  const seen = new Set();
  const visit = (name, trail = []) => {
    if (seen.has(name) || !workspace.has(name)) return;
    if (trail.includes(name)) return; // a cycle; npm would reject it anyway
    for (const dep of siblingDeps(workspace.get(name))) visit(dep.name, [...trail, name]);
    seen.add(name);
    ordered.push(name);
  };
  for (const name of workspace.keys()) visit(name);
  return ordered.filter((name) => !workspace.get(name).pkg.private);
}

const problems = [];
const unknown = [];
let checked = 0;

for (const [name, entry] of workspace) {
  if (entry.pkg.private) continue;

  for (const dep of siblingDeps(entry)) {
    // A sibling going out in this same release is not yet on the registry and
    // is not supposed to be.
    if (publishing.has(dep.name)) continue;

    const target = workspace.get(dep.name);
    if (target.pkg.private) {
      problems.push(
        `${name} declares ${dep.name} in ${dep.field}, but ${dep.name} is private — ` +
          'it can never be published, so no consumer can install this.',
      );
      continue;
    }

    const versions = publishedVersions(dep.name);
    if (versions === null) {
      unknown.push(dep.name);
      continue;
    }

    checked += 1;
    // A workspace protocol or `*` is rewritten by npm at publish time; only a
    // real range can be checked here.
    if (dep.range === '*' || dep.range.startsWith('workspace:')) continue;

    if (!versions.some((version) => semver.satisfies(version, dep.range))) {
      problems.push(
        `${name} declares ${dep.name}@${dep.range} in ${dep.field}, and the registry has ` +
          (versions.length === 0
            ? `no published ${dep.name} at all.`
            : `no matching version (published: ${versions.slice(-3).join(', ')}).`) +
          `\n      Publish ${dep.name} first, or add it to --publishing for this release.`,
      );
    }
  }
}

if (unknown.length > 0) {
  console.warn(
    `check-publishable: could not reach the registry for ${[...new Set(unknown)].join(', ')} — ` +
      'skipped. This check needs network; a failure to ask is not a failure to publish.',
  );
}

if (problems.length > 0) {
  console.error(`\n${problems.length} unpublishable workspace dependenc(ies):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\nPublish order for this workspace:\n  ${publishOrder().join('\n  ')}\n`);
  process.exit(1);
}

console.log(
  `check-publishable: ${checked} workspace dependenc(ies) resolve from the registry` +
    (publishing.size > 0 ? `, ${publishing.size} shipping in this release` : '') +
    '.',
);
