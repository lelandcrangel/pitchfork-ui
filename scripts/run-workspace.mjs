#!/usr/bin/env node
/**
 * Runs a workspace's npm script, or says why it did not.
 *
 *   node scripts/run-workspace.mjs @pitchfork-ui/react build
 *
 * Exists for exactly one workspace: `@pitchfork-ui/react`, which is on its way
 * out. `npm run build -w @pitchfork-ui/react` fails outright when the directory
 * is gone, so every chain that mentions it -- `build`, `build:hostinger`,
 * `build:demo`, `test` -- would fail at the first step for a package that had
 * been deliberately retired.
 *
 * Only the chains go through this. `build:react` and `test:coverage` still
 * address the workspace directly, so someone asking for that package by name
 * gets npm's own error rather than a shrug.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [workspace, script, ...rest] = process.argv.slice(2);

if (!workspace || !script) {
  console.error('usage: run-workspace.mjs <workspace> <script> [args...]');
  process.exit(2);
}

/**
 * The directory this workspace name resolves to, or null.
 *
 * Read from the manifests rather than assuming the directory is named after
 * the package: `@pitchfork-ui/react` lives in `packages/react`, but nothing
 * guarantees that and a wrong guess would silently skip a package that is
 * present. The `workspaces` patterns here are all one level of `*`, so this
 * needs no glob library.
 */
function locate(name) {
  const root = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

  for (const pattern of root.workspaces ?? []) {
    const [prefix] = pattern.split('*');
    const base = join(ROOT, prefix);
    if (!existsSync(base)) continue;

    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = join(base, entry.name, 'package.json');
      if (!existsSync(manifest)) continue;
      if (JSON.parse(readFileSync(manifest, 'utf8')).name === name) return join(base, entry.name);
    }
  }

  return null;
}

const dir = locate(workspace);

if (!dir) {
  console.log(`run-workspace: ${workspace} is not in this workspace — skipping \`${script}\`.`);
  process.exit(0);
}

const result = spawnSync('npm', ['run', script, '-w', workspace, ...rest], {
  cwd: ROOT,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
