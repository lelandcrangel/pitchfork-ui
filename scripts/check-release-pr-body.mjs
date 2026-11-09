#!/usr/bin/env node
/*
 * Does release-please read back every release its own PR body declares?
 *
 * When a release PR merges, release-please decides what to tag by parsing that
 * PR's body, not the manifest or the changelogs -- and it parses the body as
 * HTML. A bare tag in a release note (`<pf-icon>`, from a commit's
 * BREAKING CHANGE footer) is an element to that parser, and it swallowed three
 * of #165's eight `<details>` sections. release-please logged "Pull request
 * contains releases, but not for component" for each, tagged the other five,
 * and opened a second release PR that would have re-released elements, mcp and
 * react as 0.4.0 / 0.6.0 / 0.19.0 with a changelog reaching back to the first
 * element commit. The packages still published, because the publish job reads
 * the manifest; the tags and GitHub releases had to be made by hand.
 *
 * Nothing before the merge could see it: the body renders fine on GitHub, the
 * changelogs are right, and every build passes. This runs release-please's own
 * parser over the body and fails on any declared section it cannot read back,
 * while the PR is still open and the fix is still cheap.
 *
 * Usage:
 *   node scripts/check-release-pr-body.mjs --release-please <dir> [--body-file <path>]
 *
 * `--release-please` is a directory with release-please installed in it, at the
 * version the action bundles: the parser is the thing under test, so a
 * reimplementation would only test itself. Without `--body-file` the body comes
 * from the pull_request event payload (GITHUB_EVENT_PATH), which for an
 * `edited` event is the body as it is now.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

function parseArgs(argv) {
  const args = { releasePlease: null, bodyFile: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return next;
    };
    if (arg === '--release-please') args.releasePlease = value();
    else if (arg === '--body-file') args.bodyFile = value();
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.releasePlease) throw new Error('--release-please <dir> is required');
  return args;
}

function readBody(bodyFile) {
  if (bodyFile) return fs.readFileSync(bodyFile, 'utf8');
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('No --body-file and no GITHUB_EVENT_PATH to read the body from');
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  return event.pull_request?.body ?? '';
}

/*
 * What the body says it releases, read as text rather than as HTML -- the
 * point is to compare the parser against something that does not share its
 * failure. release-please writes each section as exactly this line.
 */
function declaredReleases(body) {
  const pattern = /<details><summary>([^<:]+): ([^<\s]+)<\/summary>/g;
  return [...body.matchAll(pattern)].map((m) => ({ component: m[1].trim(), version: m[2] }));
}

const args = parseArgs(process.argv.slice(2));
const require = createRequire(path.resolve(args.releasePlease, 'package.json'));
const { PullRequestBody } = require('release-please/build/src/util/pull-request-body');

const body = readBody(args.bodyFile);
const declared = declaredReleases(body);

if (declared.length === 0) {
  console.error(
    'The release PR body declares no `<details><summary>component: version</summary>` ' +
      "sections. Either release-please's body format changed or this is not a release PR.",
  );
  process.exit(1);
}

// release-please's logger is noisy and its warnings are not the verdict here.
const quiet = { error() {}, warn() {}, info() {}, debug() {}, trace() {} };
const parsed = PullRequestBody.parse(body, quiet)?.releaseData ?? [];
const found = new Set(parsed.map((r) => `${r.component}@${r.version?.toString()}`));

const missing = declared.filter((d) => !found.has(`${d.component}@${d.version}`));

if (missing.length > 0) {
  /*
   * Point at what the parser trips on, which is almost always a tag. Code
   * spans are searched too: the parser is HTML, not markdown, so backticks do
   * not protect a tag from it -- measured on #165's body, where wrapping
   * `<pf-icon>` in backticks lost the same three releases.
   */
  const suspects = [...new Set(body.match(/<(?!\/?(details|summary)\b)[a-z][^>\s]*>/gi) ?? [])];
  console.error(
    `release-please cannot read ${missing.length} of the ${declared.length} releases this PR declares:\n` +
      missing.map((m) => `  - ${m.component}: ${m.version}`).join('\n') +
      '\n\nMerged as it is, those packages would be published without a tag or GitHub release, ' +
      'and release-please would open a new release PR for them straight away.' +
      (suspects.length > 0
        ? `\n\nIt parses the body as HTML, and the notes contain ${suspects.map((s) => `\`${s}\``).join(', ')}, ` +
          'which it reads as an element. Backticks do not help: it is an HTML parser, not markdown.'
        : '') +
      '\n\nThe text comes from a commit message, so fix it at the source: add a ' +
      'BEGIN_COMMIT_OVERRIDE ... END_COMMIT_OVERRIDE block to the description of the merged PR ' +
      'that the note came from, with the commit message rewritten without angle brackets ' +
      '(the pf-icon element, not <pf-icon>), and re-run release-please (workflow_dispatch) ' +
      'to regenerate this PR.',
  );
  process.exit(1);
}

console.log(
  `release-please reads back all ${declared.length} releases: ` +
    declared.map((d) => `${d.component} ${d.version}`).join(', '),
);
