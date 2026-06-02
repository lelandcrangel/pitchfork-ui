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

// Compose new MDX content
const newMdx = `${frontmatter}${mdContent}`;

// Write back to the MDX file
fs.writeFileSync(mdxPath, newMdx, 'utf8');

console.log('CHANGELOG.mdx has been synced with CHANGELOG.md');
