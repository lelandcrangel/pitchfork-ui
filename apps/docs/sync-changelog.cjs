// sync-changelog.cjs
// Generates src/CHANGELOG.mdx from a package's CHANGELOG.md (written by
// release-please) for Storybook display.
//
// The output is not committed -- every docs build and `npm run storybook` runs
// this first. It used to be committed, with a CI check that the two matched,
// which meant every release landed a stale file and reddened main until someone
// regenerated it by hand.
//
// The frontmatter is defined here rather than read back out of the previous
// output. Reading it made the generator depend on its own result, so it could
// not run on a clean checkout -- it exited with ENOENT.

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

/*
 * The elements' changelog where there is one, the React library's otherwise.
 *
 * release-please writes a CHANGELOG.md on a package's first release, and
 * @pitchfork-ui/elements has not had one yet -- so this cannot simply point at
 * the new package, and pointing at a file that is not there would fail every
 * docs build. It flips by itself at the first element release, and the page
 * says which package it is describing either way, because a changelog with no
 * package name on it is a list of claims about nothing in particular.
 */
const CANDIDATES = [
  { pkg: '@pitchfork-ui/elements', md: '../../packages/elements/CHANGELOG.md' },
  { pkg: '@pitchfork-ui/react', md: '../../packages/react/CHANGELOG.md' },
];

const source = CANDIDATES.map((candidate) => ({
  ...candidate,
  path: path.resolve(__dirname, candidate.md),
})).find((candidate) => fs.existsSync(candidate.path));

if (!source) {
  console.error(
    'sync-changelog: no CHANGELOG.md found. Looked for ' +
      CANDIDATES.map((c) => c.md).join(' and ') +
      ". release-please writes one on a package's first release.",
  );
  process.exitCode = 1;
  return;
}

const mdPath = source.path;
const mdxPath = path.resolve(__dirname, 'src/CHANGELOG.mdx');

// Drop duplicate bullets within a release section (same text, different SHA).
// Merge-commit PRs used to make release-please credit both the merge commit
// and the identical branch commit; merge commits are now disabled on the repo,
// but keep the docs page clean regardless.
function dedupeBullets(markdown) {
  const seen = new Set();
  return markdown
    .split('\n')
    .filter((line) => {
      if (line.startsWith('## ')) {
        seen.clear(); // new release section
        return true;
      }
      const bullet = line.match(/^(\* .*) \(\[\w+\]\(.*\)\)\s*$/);
      if (!bullet) return true;
      if (seen.has(bullet[1])) return false;
      seen.add(bullet[1]);
      return true;
    })
    .join('\n');
}

// The Storybook wrapper. The CHANGELOG.md supplies everything from its own
// `# Changelog` heading down.
const FRONTMATTER = `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Foundations/Changelog" />

{/* Generated from ${source.pkg}'s CHANGELOG.md by apps/docs/sync-changelog.cjs. */}

`;

async function main() {
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  const config = (await prettier.resolveConfig(mdxPath)) ?? {};
  const next = await prettier.format(`${FRONTMATTER}${dedupeBullets(mdContent)}`, {
    ...config,
    filepath: mdxPath,
  });

  const current = fs.existsSync(mdxPath) ? fs.readFileSync(mdxPath, 'utf8') : null;
  if (next === current) {
    console.log('CHANGELOG.mdx is up to date.');
    return;
  }

  fs.writeFileSync(mdxPath, next, 'utf8');
  console.log(
    current === null
      ? `CHANGELOG.mdx generated from ${source.pkg}'s CHANGELOG.md`
      : `CHANGELOG.mdx has been synced with ${source.pkg}'s CHANGELOG.md`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
