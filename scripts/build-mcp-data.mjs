/**
 * Bundles the generated artifacts the MCP server serves.
 *
 * The server prefers the consumer's own installed packages so its answers match
 * the version they are building against. These copies are the fallback that
 * makes `npx @pitchfork-ui/mcp` work on its own.
 *
 * Run after build:elements-metadata and the tokens build.
 */

import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'packages/mcp/data');

const sources = [
  ['packages/elements/dist/elements.json', 'elements.json', 'npm run build:elements-metadata'],
  ['packages/tokens/dist/json/tokens.json', 'tokens.json', 'npm run build:tokens'],
  /*
   * The React metadata is `optional`, and it is the only one that is. It goes
   * with `packages/react`; the server answers its React tools from it while it
   * is here and says the layer is gone when it is not.
   *
   * A stale copy is worse than none, so a missing source **deletes** the
   * bundled file rather than leaving the last one in place. Without that the
   * server would keep answering `get_component` from whatever shipped last,
   * long after the package it describes had been deleted -- and nothing would
   * say so, because the fallback copy is exactly what makes `npx` work with no
   * install.
   */
  ['packages/react/dist/metadata.json', 'metadata.json', 'npm run build:metadata', true],
];

mkdirSync(outDir, { recursive: true });

for (const [from, to, howToBuild, optional] of sources) {
  const source = join(root, from);
  const target = join(outDir, to);

  if (!existsSync(source)) {
    if (!optional) {
      console.error(`${from} not found — run \`${howToBuild}\` first.`);
      process.exit(1);
    }
    if (existsSync(target)) {
      rmSync(target);
      console.log(`  removed stale ${to} (${from} is gone)`);
    } else {
      console.log(`  skipped ${to} (${from} is gone)`);
    }
    continue;
  }

  copyFileSync(source, target);
  console.log(`  bundled ${to}`);
}

console.log('mcp data bundled to packages/mcp/data/');
