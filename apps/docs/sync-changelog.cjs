// sync-changelog.cjs
// Syncs packages/react/CHANGELOG.md (written by release-please) into
// src/CHANGELOG.mdx for Storybook display.
//
// The output is run through Prettier before it is written, so the committed
// file and the regenerated one are byte-identical and `format:check` stays
// green after a build. Pass `--check` to verify that without writing — CI uses
// it to catch a CHANGELOG.mdx that was not regenerated after a release.

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const mdPath = path.resolve(__dirname, '../../packages/react/CHANGELOG.md');
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

async function main() {
  const check = process.argv.includes('--check');

  // Read the MDX file to preserve the Storybook frontmatter
  const current = fs.readFileSync(mdxPath, 'utf8');
  const frontmatterEnd = current.indexOf('# Changelog');
  if (frontmatterEnd === -1) {
    throw new Error(
      `${mdxPath} is missing its "# Changelog" heading — cannot find the frontmatter.`,
    );
  }
  const frontmatter = current.slice(0, frontmatterEnd);

  const mdContent = fs.readFileSync(mdPath, 'utf8');

  const config = (await prettier.resolveConfig(mdxPath)) ?? {};
  const next = await prettier.format(`${frontmatter}${dedupeBullets(mdContent)}`, {
    ...config,
    filepath: mdxPath,
  });

  if (next === current) {
    console.log('CHANGELOG.mdx is up to date.');
    return;
  }

  if (check) {
    console.error(
      'CHANGELOG.mdx is out of sync with packages/react/CHANGELOG.md.\n' +
        'Run `npm run sync-changelog -w @pitchfork-ui/docs` and commit the result.',
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(mdxPath, next, 'utf8');
  console.log('CHANGELOG.mdx has been synced with CHANGELOG.md');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
