#!/usr/bin/env node
/**
 * Deprecates every published version of `@pitchfork-ui/react`.
 *
 *   node scripts/deprecate-react.mjs            # report what it would do
 *   node scripts/deprecate-react.mjs --apply    # write it to the registry
 *   node scripts/deprecate-react.mjs --check    # warn in CI about any version without it
 *
 * This is Phase 6 of `REACT-RETIREMENT-PLAN.md`, and it is a script rather than
 * a command in a commit message for the same three reasons
 * `setup-trusted-publishers.mjs` is:
 *
 *   - **The range has to be `*`.** `npm deprecate <pkg> <message>` with no
 *     range deprecates *nothing* and exits 0 -- it reads the bare name as the
 *     spec and matches no version. Every one of the published versions has to
 *     be covered, or someone pinning an old one is never told.
 *   - **The message is the only thing a consumer sees.** It appears on every
 *     `npm install` of any version, forever, and editing it means running the
 *     command again. It is built here from the stated window and the guide's
 *     URL so it cannot be half-remembered at a terminal.
 *   - **Nothing checks it afterwards.** Deprecation is metadata; the package
 *     keeps installing and keeps working, which is the point. So this reads
 *     the registry back and reports which versions actually carry the notice.
 *
 * Deprecation is a notice, not a removal: the package stays installable and
 * stays publishable, so a security patch remains possible for the whole window.
 * Phase 7 is the irreversible step and waits for that window to close.
 *
 * **Re-run it after any further publish.** A version published after this has
 * no deprecation of its own -- the registry stores the flag per version, not
 * per package -- so a patch release would quietly arrive undeprecated. That is
 * why the report lists the undeprecated versions rather than a count, and why
 * the release workflow runs `--check` after every publish.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { WINDOW_ENDS } from './lib/retirement.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = '@pitchfork-ui/react';

const apply = process.argv.includes('--apply');
const check = process.argv.includes('--check');

const elementsPkg = JSON.parse(readFileSync(join(ROOT, 'packages/elements/package.json'), 'utf8'));
const site = elementsPkg.homepage.replace(/\/$/, '');

/*
 * One sentence of what to do, one of where to read, one of how long. In that
 * order, because npm prints it inline during an install and a reader gets to
 * the end of the first line and no further.
 */
const MESSAGE =
  `Deprecated — use ${elementsPkg.name} instead (React bindings: ` +
  `@pitchfork-ui/elements-react). Migration guide with a codemod: ` +
  `${site}/?path=/docs/foundations-migrating--docs. ` +
  `Still installable and still patched for security until ${WINDOW_ENDS}.`;

/** Every published version, and whether it already carries a notice. */
async function published() {
  const url = `https://registry.npmjs.org/${PACKAGE.replace('/', '%2f')}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`the registry answered ${response.status} for ${PACKAGE}`);
  }
  const document = await response.json();
  return Object.entries(document.versions).map(([version, manifest]) => ({
    version,
    deprecated: manifest.deprecated ?? null,
  }));
}

const before = await published();
const undeprecated = before.filter((entry) => !entry.deprecated);

/*
 * `--check` is the release workflow's reminder, and it cannot be the fix:
 * trusted publishing authenticates `npm publish` and nothing else, so the job
 * that just published a version has no credentials to deprecate it. It
 * reports instead, as a warning on the run and a line in its summary, and
 * never fails -- the publish it follows has already succeeded, and a red run
 * reads as a release that needs re-running.
 *
 * The version on disk counts too. The registry took five minutes to list
 * 0.19.1 after its publish, so a check that only read the packument straight
 * after publishing would report the old versions and miss the new one -- the
 * one this check exists for.
 */
if (check) {
  // Once Phase 7 removes the package from the workspace there is no version on
  // disk, and the registry's list is the whole answer.
  const manifest = join(ROOT, 'packages/react/package.json');
  const local = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).version : null;
  const missing = undeprecated.map((entry) => entry.version);
  if (local && !before.some((entry) => entry.version === local)) missing.push(local);

  if (missing.length === 0) {
    console.log(`${PACKAGE}: every published version carries the deprecation notice.`);
    process.exit(0);
  }

  const text =
    `${PACKAGE} ${missing.join(', ')} ${missing.length === 1 ? 'has' : 'have'} no npm ` +
    'deprecation notice. Run `npm run deprecate:react -- --apply` with your own npm login.';
  console.log(`::warning title=Deprecate ${PACKAGE}::${text}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Deprecation notice missing\n\n${text}\n`);
  }
  process.exit(0);
}

console.log(`${PACKAGE}: ${before.length} published version(s)`);
console.log(`  already deprecated: ${before.length - undeprecated.length}`);
console.log(`  not yet:            ${undeprecated.length}`);
console.log(`\nmessage (${MESSAGE.length} chars):\n  ${MESSAGE}\n`);

if (!apply) {
  console.log(`Nothing was written. Pass --apply to run:`);
  console.log(`  npm deprecate "${PACKAGE}@*" "<the message above>"`);
  console.log(
    '\nIt needs your own npm credentials — `npm whoami` has to answer, and the ' +
      'account needs publish rights on the scope. A trusted publisher grants ' +
      '*publish* only, which is why the release workflow runs --check and not ' +
      'this.',
  );
  process.exit(0);
}

try {
  execFileSync('npm', ['deprecate', `${PACKAGE}@*`, MESSAGE], { stdio: 'inherit' });
} catch (error) {
  console.error(
    `\nnpm deprecate failed. Check \`npm whoami\` and that the account has ` +
      `publish rights on the @pitchfork-ui scope.`,
  );
  process.exit(error.status ?? 1);
}

/*
 * Read it back. `npm deprecate` exits 0 having deprecated nothing if the range
 * matched nothing, so its exit code is not the answer -- and the registry's
 * cached packument lags a write, hence the retries.
 */
for (let attempt = 1; attempt <= 6; attempt += 1) {
  const after = await published();
  const missing = after.filter((entry) => !entry.deprecated).map((entry) => entry.version);

  if (missing.length === 0) {
    console.log(`\nAll ${after.length} version(s) now carry the notice.`);
    process.exit(0);
  }

  if (attempt === 6) {
    console.error(
      `\n${missing.length} version(s) still carry no notice: ${missing.join(', ')}. ` +
        'The registry caches the package document for a few minutes, so this may ' +
        'simply be stale — run without --apply in a minute to check again.',
    );
    process.exitCode = 1;
  } else {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
