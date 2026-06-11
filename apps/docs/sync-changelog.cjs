// sync-changelog.cjs
// Syncs packages/react/CHANGELOG.md (written by release-please) into
// src/CHANGELOG.mdx for Storybook display.

const fs = require('fs');
const path = require('path');

const mdPath = path.resolve(__dirname, '../../packages/react/CHANGELOG.md');
const mdxPath = path.resolve(__dirname, 'src/CHANGELOG.mdx');

// Read the MDX file to preserve the Storybook frontmatter
const mdxContent = fs.readFileSync(mdxPath, 'utf8');
const frontmatterEnd = mdxContent.indexOf('# Changelog');
const frontmatter = mdxContent.slice(0, frontmatterEnd);

// Read the Markdown changelog
const mdContent = fs.readFileSync(mdPath, 'utf8');

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

// Compose new MDX content
const newMdx = `${frontmatter}${dedupeBullets(mdContent)}`;

// Write back to the MDX file
fs.writeFileSync(mdxPath, newMdx, 'utf8');

console.log('CHANGELOG.mdx has been synced with CHANGELOG.md');
