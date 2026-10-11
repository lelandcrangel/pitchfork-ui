/**
 * Sets up (or just reports on) the npm trusted publisher for every publishable
 * package, one package at a time, and says exactly what is wrong with each.
 *
 *   node scripts/setup-trusted-publishers.mjs              # report only
 *   node scripts/setup-trusted-publishers.mjs --configure   # create what is missing
 *
 * It exists because doing this by hand is three easy mistakes in a row:
 *
 *   - A shell loop over five `npm trust` calls does not survive a paste. Run
 *     one at a time, which is what this does, and report each separately.
 *   - `--repo`, `--file` and `--env` have to match the workflow exactly and npm
 *     validates none of them when the configuration is saved -- only at publish
 *     time, after release-please has cut and pushed the tags. They are read out
 *     of `.github/workflows/release-please.yml` here so they cannot drift.
 *   - A newly published version does not appear in the registry's cached
 *     packument for a while, so `npm view <pkg> version` and the full package
 *     document both lie right after a publish. The per-version endpoint does
 *     not, so that is what this asks.
 *
 * What it cannot do is tick **Allow npm publish**, which is a checkbox on
 * npmjs.com, off by default, and without which the publisher may only *stage* a
 * publish -- so a release fails at `npm publish` after the tags are already
 * pushed. The summary lists every package still needing it.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = '.github/workflows/release-please.yml';
const configure = process.argv.includes('--configure');

const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** The repo the publisher must trust, from the git remote. */
function repoSlug() {
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  const m = /github\.com[:/](.+?)(?:\.git)?$/.exec(url);
  if (!m) throw new Error(`cannot read an owner/repo out of the origin remote: ${url}`);
  return m[1];
}

/**
 * `--env` must equal the workflow job's `environment:`. Read rather than typed,
 * because a mismatch is accepted at save time and only fails at publish time.
 */
function workflowEnvironment() {
  const text = read(WORKFLOW);
  const m = /^\s*environment:\s*([A-Za-z0-9_.-]+)\s*$/m.exec(text);
  if (!m) {
    throw new Error(
      `no \`environment:\` in ${WORKFLOW}. The publisher's --env has to match it, ` +
        'so refusing to guess.',
    );
  }
  return m[1];
}

/** Every publishable workspace package, in the config's own order. */
function publishablePackages() {
  const config = JSON.parse(read('release-please-config.json'));
  const out = [];
  for (const dir of Object.keys(config.packages ?? {})) {
    const pkg = JSON.parse(read(join(dir, 'package.json')));
    if (pkg.private) continue;
    out.push({ dir, name: pkg.name, version: pkg.version });
  }
  return out;
}

/**
 * Is this exact version on the registry? The per-version endpoint, because the
 * cached packument lags a fresh publish by minutes and reports the old `latest`
 * (or only npm's `0.0.0-stage` name-reservation placeholder) in the meantime.
 */
async function isPublished(name, version) {
  const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.status === 200;
  } catch (error) {
    return { error: error.message };
  }
}

/** Run a command, returning its output and never throwing. */
function run(cmd, args) {
  try {
    return { ok: true, out: execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim() };
  } catch (error) {
    const text = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    return { ok: false, out: text || error.message };
  }
}

/** The first line that actually says something, for a one-line report. */
const firstUseful = (text) =>
  text
    .split('\n')
    .map((l) => l.replace(/^npm (error|warn)\s*/, '').trim())
    // `code ENEEDAUTH` on its own says nothing a reader can act on, and npm
    // always prints it before the sentence that does.
    .find((l) => l.length > 0 && !/^A complete log/.test(l) && !/^code [A-Z0-9_]+$/.test(l)) ??
  '(no output)';

const slug = repoSlug();
const environment = workflowEnvironment();
const workflowFile = WORKFLOW.split('/').pop();

console.log(`repo:        ${slug}`);
console.log(`workflow:    ${workflowFile}`);
console.log(`environment: ${environment}`);
console.log(
  configure ? 'mode:        configure\n' : 'mode:        report only (pass --configure)\n',
);

const who = run('npm', ['whoami']);
if (!who.ok) {
  console.error(`Not logged in to npm: ${firstUseful(who.out)}`);
  console.error('Run `npm login`, then run this again.');
  process.exit(1);
}
console.log(`logged in as ${who.out}\n`);

const rows = [];

for (const pkg of publishablePackages()) {
  const published = await isPublished(pkg.name, pkg.version);
  const row = { name: pkg.name, version: pkg.version, published, publisher: '-', note: '' };

  if (published !== true) {
    // A publisher cannot be configured for a name the registry does not have,
    // which is the whole reason the five new names needed a hand publish.
    row.note =
      published && published.error
        ? `could not reach the registry: ${published.error}`
        : 'not on the registry at this version — publish it by hand first';
    rows.push(row);
    continue;
  }

  const list = run('npm', ['trust', 'list', pkg.name]);
  const hasOne = list.ok && /github/i.test(list.out) && !/no trusted/i.test(list.out);
  row.publisher = list.ok ? (hasOne ? 'present' : 'none') : `unreadable (${firstUseful(list.out)})`;

  if (hasOne) {
    row.note = 'already configured — check "Allow npm publish" is ticked on npmjs.com';
    rows.push(row);
    continue;
  }

  if (!configure) {
    row.note = 'would configure';
    rows.push(row);
    continue;
  }

  const created = run('npm', [
    'trust',
    'github',
    pkg.name,
    '--repo',
    slug,
    '--file',
    workflowFile,
    '--env',
    environment,
    '--yes',
  ]);
  row.publisher = created.ok ? 'created' : 'FAILED';
  row.note = created.ok ? 'now tick "Allow npm publish" on npmjs.com' : firstUseful(created.out);
  rows.push(row);
}

const width = Math.max(...rows.map((r) => r.name.length), 7);
console.log(`${'package'.padEnd(width)}  ${'ver'.padEnd(8)}  on npm  publisher   note`);
for (const r of rows) {
  console.log(
    `${r.name.padEnd(width)}  ${String(r.version).padEnd(8)}  ` +
      `${(r.published === true ? 'yes' : 'NO').padEnd(6)}  ${r.publisher.padEnd(10)}  ${r.note}`,
  );
}

const needTick = rows.filter((r) => r.publisher === 'created' || r.publisher === 'present');
const failed = rows.filter((r) => r.publisher === 'FAILED' || r.published !== true);

if (needTick.length > 0) {
  console.log(
    '\nOne thing no CLI can do: on npmjs.com, each package above needs its trusted\n' +
      'publisher\'s "Allow npm publish" ticked. It is OFF by default, and with it off a\n' +
      'release fails at the publish step AFTER release-please has pushed the tags.\n' +
      '@pitchfork-ui/react is the known-good configuration to copy.\n' +
      '\nThen: Actions -> "Verify npm trusted publisher" -> pick each package. Read the\n' +
      'result by its message, not its exit code:\n' +
      '  "cannot publish over"                    -> correct\n' +
      '  "OIDC permission denied for this action" -> the box is not ticked\n' +
      '  E404 on PUT                              -> no usable publisher',
  );
}

if (failed.length > 0) {
  console.log(`\n${failed.length} package(s) still need attention — see the notes above.`);
  process.exitCode = 1;
}
