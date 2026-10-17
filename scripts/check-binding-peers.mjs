#!/usr/bin/env node
/**
 * Keeps the generated bindings' host-framework peers open.
 *
 *   node scripts/check-binding-peers.mjs
 *
 * The three binding packages wrap standard custom elements. Nothing about the
 * wrapper cares which minor of React, Angular or Vue it is handed, so each
 * declares an open floor -- `react >=18.2.0`, `@angular/core >=18.0.0`,
 * `vue >=3.4.38` -- and a consumer on any later version is served.
 *
 * **Dependabot rewrites a `peerDependencies` range like any other
 * requirement**, which is how it proposed exactly the two things this refuses,
 * in one PR, against entirely working code:
 *
 *   - It narrowed `@angular/common`, `core` and `forms` from `>=18.0.0` to
 *     `^21.2.25`, which drops every consumer on Angular 18, 19 and 20 from a
 *     package whose published major does not change.
 *   - It took `forms` to `^22.2.2` while leaving `common` and `core` at
 *     `^21.2.25`. Angular's own packages peer each other **exactly**
 *     (`@angular/forms@22.2.2` wants `@angular/core@"22.2.2"`), so that set is
 *     not merely narrow, it is unsatisfiable -- and it would have gone to the
 *     registry, where it cannot be taken back.
 *
 * Both are invisible to every other check here: the manifests parse, the
 * workspace installs from its own lockfile, and nothing builds or tests a
 * consumer on the version that was just excluded.
 *
 * What this does **not** try to catch is a floor deliberately raised and
 * written as a floor (`>=21.0.0`). That is a human decision with a major
 * version behind it; the point here is that it cannot happen by accident, in a
 * caret, in a dependency bump nobody read closely.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The generated bindings, and the host framework each one is a binding for. */
const BINDINGS = {
  'elements-react': 'React',
  'elements-angular': 'Angular',
  'elements-vue': 'Vue',
};

const problems = [];

for (const [pkg, framework] of Object.entries(BINDINGS)) {
  const manifest = join(ROOT, 'packages', pkg, 'package.json');
  const { name, peerDependencies: peers = {} } = JSON.parse(readFileSync(manifest, 'utf8'));

  if (Object.keys(peers).length === 0) {
    problems.push(`${name} declares no peerDependencies — it is a ${framework} binding.`);
    continue;
  }

  for (const [dep, range] of Object.entries(peers)) {
    if (!/^>=\s*\d/.test(range)) {
      problems.push(
        `${name} peers ${dep} as \`${range}\` — a binding's peer is an open floor ` +
          '(`>=x.y.z`), so a consumer on an earlier supported version of ' +
          `${framework} is not dropped by a dependency bump.`,
      );
    }
  }

  /*
   * Angular ships its packages in lockstep and peers them at an exact version,
   * so two different ranges here is a set no consumer can satisfy.
   */
  const angular = Object.entries(peers).filter(([dep]) => dep.startsWith('@angular/'));
  const distinct = new Set(angular.map(([, range]) => range));
  if (distinct.size > 1) {
    problems.push(
      `${name} peers Angular at ${distinct.size} different ranges ` +
        `(${angular.map(([dep, range]) => `${dep} ${range}`).join(', ')}). ` +
        'Angular packages peer each other at an exact version, so that set is unsatisfiable.',
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) with the bindings' peer ranges:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `${Object.keys(BINDINGS).length} binding package(s): every host-framework peer is an open floor.`,
);
