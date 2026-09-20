/**
 * Bundles the generated artifacts the MCP server serves.
 *
 * The server prefers the consumer's own installed @pitchfork-ui/react so its
 * answers match the version they are building against. These copies are the
 * fallback that makes `npx @pitchfork-ui/mcp` work on its own.
 *
 * Run after build:metadata and the tokens build.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'packages/mcp/data');

const sources = [
  ['packages/react/dist/metadata.json', 'metadata.json', 'npm run build:metadata'],
  ['packages/tokens/dist/json/tokens.json', 'tokens.json', 'npm run build:tokens'],
];

mkdirSync(outDir, { recursive: true });

for (const [from, to, howToBuild] of sources) {
  const source = join(root, from);
  if (!existsSync(source)) {
    console.error(`${from} not found — run \`${howToBuild}\` first.`);
    process.exit(1);
  }
  copyFileSync(source, join(outDir, to));
  console.log(`  bundled ${to}`);
}

console.log('mcp data bundled to packages/mcp/data/');
