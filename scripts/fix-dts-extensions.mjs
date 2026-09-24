#!/usr/bin/env node
/**
 * Give every relative specifier in the emitted declarations an explicit
 * extension, the way the emitted JavaScript already has one.
 *
 * The dts plugin writes `export * from './components/Badge'`. The JS beside it
 * writes `./components/Badge/index.js`. Under `moduleResolution: "bundler"`
 * both resolve, so nothing looks wrong -- but this package is `"type":
 * "module"`, and under `node16`/`nodenext` an extensionless relative specifier
 * does not resolve at all. With `skipLibCheck` on (the default in most app
 * configs) those failures are silent, so `dist/index.d.ts` resolves to a module
 * that exports nothing and every import off it fails with:
 *
 *   Module '"@pitchfork-ui/react"' has no exported member 'Badge'.
 *
 * Runs over dist after `vite build`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(
  process.argv[2] ??
    join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'react', 'dist'),
);

if (!existsSync(distDir)) {
  console.error(`${distDir} does not exist -- build the package first.`);
  process.exit(1);
}

async function declarationFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await declarationFiles(path)));
    else if (entry.name.endsWith('.d.ts')) found.push(path);
  }
  return found;
}

/** `from './x'` and `import('./x')`, in declaration files only. */
const SPECIFIER = /((?:from|import\()\s*)(['"])(\.[^'"]*)\2/g;

function resolveSpecifier(fileDir, specifier) {
  // Already carries an extension the resolver understands.
  if (/\.(js|mjs|cjs|json|css)$/.test(specifier)) return null;

  const target = resolve(fileDir, specifier);
  if (existsSync(`${target}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(target, 'index.d.ts'))) return `${specifier}/index.js`;
  return null;
}

let rewritten = 0;
let unresolved = 0;
const files = await declarationFiles(distDir);

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const fileDir = dirname(file);
  let changed = false;

  const output = source.replace(SPECIFIER, (match, lead, quote, specifier) => {
    const replacement = resolveSpecifier(fileDir, specifier);
    if (replacement === null) {
      if (!/\.(js|mjs|cjs|json|css)$/.test(specifier)) {
        console.warn(`  ${file}: cannot resolve ${specifier}`);
        unresolved += 1;
      }
      return match;
    }
    changed = true;
    rewritten += 1;
    return `${lead}${quote}${replacement}${quote}`;
  });

  if (changed) writeFileSync(file, output);
}

console.log(
  `dts extensions: rewrote ${rewritten} specifier(s) across ${files.length} declaration file(s)`,
);

if (unresolved > 0) {
  console.error(
    `${unresolved} relative specifier(s) point at no declaration file -- the ` +
      'declarations are incomplete, which would break node16 resolution.',
  );
  process.exitCode = 1;
}
