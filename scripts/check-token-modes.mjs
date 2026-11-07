#!/usr/bin/env node
/**
 * Keeps a semantic colour's two modes in one place.
 *
 *   node scripts/check-token-modes.mjs
 *
 * The dark mode used to be 32 hand-written `--color-semantic-*` lines in
 * `theme.css`, so each semantic colour had its light value in
 * `src/tokens/color.json` and its dark value in a stylesheet. Nothing related
 * the two, and one pair had drifted: `border.disabled` had no dark value at
 * all, because `--pf-control-border-disabled` named the `gray-200` primitive
 * instead of the semantic token. A primitive does not move between modes, so a
 * disabled control border sat at 14.48:1 on the dark background while its
 * enabled counterpart moved to 3.75:1 — the disabled control read as the more
 * prominent of the two. No contrast check could catch it: WCAG exempts disabled
 * controls, so it was not a contrast failure, just wrong.
 *
 * Each semantic colour now carries its dark value under
 * `$extensions['pitchfork.dark']`, and `style-dictionary.config.mjs` generates
 * the CSS. This refuses the three ways that arrangement comes apart.
 *
 * The second and third are the ones worth having. The build already throws on a
 * dangling reference, but it throws during a build; this says so in a second,
 * from the source, with the token named. And the third is the only thing
 * standing between the repo and a second copy of the dark mode: re-adding one
 * hand-written `--color-semantic-*` line to `theme.css` would silently win over
 * the generated value for that token and nothing else would complain.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DARK_KEY = 'pitchfork.dark';
const COLORS = join(ROOT, 'packages/tokens/src/tokens/color.json');
const THEME = join(ROOT, 'packages/tokens/src/theme.css');

const problems = [];

const colors = JSON.parse(readFileSync(COLORS, 'utf8'));

/** Every token under a subtree, as [dotted path, token]. */
function tokensIn(node, path = []) {
  const found = [];
  for (const [key, value] of Object.entries(node ?? {})) {
    if (!value || typeof value !== 'object') continue;
    if ('$value' in value) found.push([[...path, key].join('.'), value]);
    else found.push(...tokensIn(value, [...path, key]));
  }
  return found;
}

const semantic = tokensIn(colors.color?.semantic);
if (semantic.length === 0) {
  console.error('No semantic colour tokens found — has color.json moved?');
  process.exit(2);
}

// 1. Both modes, on every semantic colour.
for (const [path, token] of semantic) {
  if (!token.$extensions?.[DARK_KEY]) {
    problems.push(
      `color.semantic.${path} has a light value and no dark one. Add ` +
        `$extensions['${DARK_KEY}'], because a semantic colour that does not move ` +
        'between modes is almost always an oversight rather than a decision — and ' +
        'the one time it was, a disabled border ended up brighter than an enabled one.',
    );
  }
}

// 2. A dark value references a primitive that exists.
const everyPath = new Set(tokensIn(colors.color, ['color']).map(([path]) => path));
for (const [path, token] of semantic) {
  const reference = token.$extensions?.[DARK_KEY];
  if (typeof reference !== 'string') continue;
  if (!/^\{[^{}]+\}$/.test(reference)) {
    problems.push(
      `color.semantic.${path}: its dark value ${JSON.stringify(reference)} is a literal. ` +
        'Reference a primitive instead, so both modes move when the palette does.',
    );
    continue;
  }
  const target = reference.slice(1, -1);
  if (!everyPath.has(target)) {
    problems.push(`color.semantic.${path}: its dark value {${target}} is not a token.`);
  }
}

// 3. Nothing hand-writes a semantic colour into theme.css's dark block.
if (existsSync(THEME)) {
  const theme = readFileSync(THEME, 'utf8');
  const start = theme.indexOf("[data-theme='dark'] {");
  if (start !== -1) {
    const block = theme.slice(start, theme.indexOf('\n}', start));
    const handWritten = [...block.matchAll(/^\s*(--color-semantic-[a-z0-9-]+)\s*:/gm)].map(
      (match) => match[1],
    );
    for (const name of new Set(handWritten)) {
      problems.push(
        `theme.css's dark block declares ${name} by hand. That value is generated from ` +
          `$extensions['${DARK_KEY}'] in color.json; declaring it here too puts the dark ` +
          'mode in two places again, and this copy would win.',
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) with the token modes:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `${semantic.length} semantic colour(s): each carries a light and a dark value, ` +
    "every dark value references a primitive, and theme.css's dark block hand-writes none.",
);
