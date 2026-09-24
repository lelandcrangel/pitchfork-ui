#!/usr/bin/env node
/**
 * Every icon name this repository writes must be one `Icon` resolves.
 *
 * The MCP server's `validate_usage` checks the code an agent generates. Nothing
 * checked the library's own. That is how `EmptyState`'s published examples
 * shipped using `folder-open`, `bell` and `file` — none of them registered, all
 * of them rendering an empty slot in the docs site — and how `FileUploader`
 * shipped rendering nothing for `file-arrow-up` before that.
 *
 * Resolution is mirrored from Icon.tsx via metadata.json, which carries the
 * canonical names, the Font Awesome aliases and the legacy camelCase map. Run
 * after `build:metadata`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metadataPath = join(repoRoot, 'packages/react/dist/metadata.json');

if (!existsSync(metadataPath)) {
  console.error('packages/react/dist/metadata.json is missing — run build:metadata first.');
  process.exit(1);
}

const { icons } = JSON.parse(readFileSync(metadataPath, 'utf8'));
if (!icons?.all?.length) {
  console.error('metadata.json carries no icon registry — build:metadata is out of date.');
  process.exit(1);
}

const custom = new Set(icons.custom);
const fontAwesome = new Set([...icons.fontAwesome, ...icons.aliases]);
const legacyAliases = icons.legacyAliases ?? {};

const toKebabCase = (value) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** Mirrors Icon: custom raw, then everything by its normalized name. */
function resolves(name) {
  if (custom.has(name)) return true;
  const normalized = legacyAliases[name] ?? toKebabCase(name);
  return custom.has(normalized) || fontAwesome.has(normalized);
}

const SEARCH = ['packages/react/src', 'apps/docs/src', 'apps/demo/src', 'apps/theme-builder/src'];

/**
 * Only props that are unambiguously an icon name. A bare `name=` is the `name`
 * attribute on half the form elements in the repo, so it counts only on `Icon`
 * itself.
 */
const PATTERNS = [
  /iconName=["']([^"'{}]+)["']/g,
  /iconName:\s*["']([^"']+)["']/g,
  /<Icon\b[^>]*?\bname=["']([^"'{}]+)["']/g,
];

/**
 * Tests are exempt, and have to be: a test that an unknown name renders
 * nothing and warns can only be written by using an unknown name.
 */
const isTest = (name) => /\.(test|spec)\.(tsx?|jsx?)$/.test(name);

async function sourceFiles(dir) {
  const found = [];
  if (!existsSync(dir)) return found;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await sourceFiles(path)));
    else if (/\.(tsx?|mdx)$/.test(entry.name) && !isTest(entry.name)) found.push(path);
  }
  return found;
}

/**
 * The names a file registers for itself.
 *
 * Exempting the whole file because it mentions `registerIcons` would make this
 * check unsound: a file could register one icon and misspell another a line
 * later, and nothing would say so. Only the names actually registered count,
 * and only in the file that registers them.
 */
function registeredIn(contents) {
  const registered = new Set();

  for (const call of contents.matchAll(/registerIcons\s*\(/g)) {
    // Brace-match the argument object so a nested value cannot end it early.
    const open = contents.indexOf('{', call.index);
    if (open === -1) continue;

    let depth = 0;
    let close = -1;
    for (let i = open; i < contents.length; i += 1) {
      if (contents[i] === '{') depth += 1;
      else if (contents[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (close === -1) continue;

    // `'paper-plane': faPaperPlane` / `comments: faComments`. Requiring the
    // `fa...` value keeps this from matching any other key in the block.
    for (const [, quoted, bare] of contents
      .slice(open, close)
      .matchAll(/(?:'([^']+)'|([A-Za-z][A-Za-z0-9-]*))\s*:\s*fa[A-Z]/g)) {
      registered.add(quoted ?? bare);
    }
  }

  return registered;
}

const problems = [];

for (const searchDir of SEARCH) {
  for (const file of await sourceFiles(join(repoRoot, searchDir))) {
    const contents = readFileSync(file, 'utf8');
    const registered = registeredIn(contents);

    for (const pattern of PATTERNS) {
      for (const match of contents.matchAll(pattern)) {
        const name = match[1];
        if (resolves(name) || registered.has(name)) continue;
        const line = contents.slice(0, match.index).split('\n').length;
        problems.push({ file: relative(repoRoot, file), line, name });
      }
    }
  }
}

if (problems.length > 0) {
  console.error(
    `\n${problems.length} icon name(s) this repository uses that Icon does not resolve:`,
  );
  for (const { file, line, name } of problems) {
    console.error(`  ${file}:${line}  "${name}"`);
  }
  console.error(
    '\nEach renders an empty slot. Add the icon to `bundledRegularIcons` in ' +
      'Icon.tsx, or use one of the names getAvailableIconNames() returns.',
  );
  process.exitCode = 1;
} else {
  console.log('icon names: every name used in this repository resolves');
}
