#!/usr/bin/env node
/*
 * Ships the type declarations of `@stencil/react-output-target/runtime`
 * inside @pitchfork-ui/elements-react, beside the runtime JavaScript that
 * Vite bundles into `dist/vendor/` (see that package's vite.config.ts for
 * why it is bundled rather than depended on).
 *
 * The generated declarations import `StencilReactComponent` from
 * `@stencil/react-output-target/runtime`. With that package no longer a
 * dependency, a consumer could not resolve the specifier, and every
 * component would type as `any` under `skipLibCheck` -- silently. So the
 * runtime's own `.d.ts` files are copied in and every reference is pointed
 * at the copy.
 *
 * Usage: node scripts/vendor-react-runtime-types.mjs <dist dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const dist = path.resolve(process.argv[2] ?? 'dist');
const SPECIFIER = '@stencil/react-output-target/runtime';

const require = createRequire(path.join(dist, '..', 'package.json'));
// Located through `/runtime`, the one entry its exports map does name -- its
// `package.json` is not exported. The declarations sit in `runtime/` beside it.
const runtimeEntry = require.resolve(SPECIFIER);
const sourceTypes = path.join(path.dirname(runtimeEntry), 'runtime');
const target = path.join(dist, 'vendor', 'react-output-target-runtime');

// Only what the runtime's index reaches; the SSR and test declarations
// describe code that is not bundled.
const FILES = ['index.d.ts', 'create-component.d.ts'];
fs.mkdirSync(target, { recursive: true });
for (const file of FILES) {
  const from = path.join(sourceTypes, file);
  if (!fs.existsSync(from)) {
    throw new Error(`${from} is missing -- the output target's layout changed; update FILES`);
  }
  fs.copyFileSync(from, path.join(target, file));
}

// Anything the copied files import must be a declared dependency or a sibling.
for (const file of FILES) {
  const text = fs.readFileSync(path.join(target, file), 'utf8');
  for (const [, spec] of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (spec.startsWith('.')) {
      const sibling = `${spec.replace(/\.js$/, '')}.d.ts`;
      if (!FILES.includes(path.basename(sibling))) {
        throw new Error(`${file} imports ${spec}, which is not copied -- add it to FILES`);
      }
    } else if (!['@lit/react', 'react'].includes(spec)) {
      throw new Error(`${file} imports ${spec}; declare it in elements-react or vendor it`);
    }
  }
}

function declarations(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return declarations(full);
    return entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

let rewritten = 0;
for (const file of declarations(dist)) {
  if (file.startsWith(target)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(SPECIFIER)) continue;
  let relative = path.relative(path.dirname(file), path.join(target, 'index.js'));
  if (!relative.startsWith('.')) relative = `./${relative}`;
  fs.writeFileSync(
    file,
    text
      .split(`'${SPECIFIER}'`)
      .join(`'${relative}'`)
      .split(`"${SPECIFIER}"`)
      .join(`"${relative}"`),
  );
  rewritten += 1;
}

const leftover = declarations(dist).filter((file) =>
  fs.readFileSync(file, 'utf8').includes(SPECIFIER),
);
if (leftover.length > 0) {
  throw new Error(`still importing ${SPECIFIER}: ${leftover.join(', ')}`);
}

console.log(
  `vendor-react-runtime-types: copied ${FILES.length} declarations, repointed ${rewritten} files`,
);
