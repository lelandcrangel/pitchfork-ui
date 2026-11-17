#!/usr/bin/env node
/*
 * Every custom property an element's stylesheet reads must be defined
 * somewhere it can resolve from.
 *
 * An undefined `var(--x)` with no fallback does not fall back to anything
 * sensible: the whole declaration becomes invalid at computed-value time, and
 * the property takes its initial value. Measured shapes of it in this repo:
 * a hover border that turned the text colour (`--pf-input-border-hover`, which
 * never existed), a placeholder drawn like a chosen date, a footer heading at
 * whatever size it inherited (`--font-size-base`), an entrance animation that
 * never ran (`--duration-medium`). None is visible to either test project,
 * which apply no `styleUrl` CSS, and the consumer smoke only catches the ones
 * someone thought to measure. A static pass catches every one.
 *
 * Defined means any of:
 *   - a token, named from packages/tokens/src/tokens/*.json the way Style
 *     Dictionary names it (path segments kebab-cased and joined) -- read from
 *     the sources, so the answer is the same on a clean checkout;
 *   - a declaration in packages/tokens/src/theme.css;
 *   - a declaration in any element stylesheet, which covers the bridges a
 *     parent sets for its children (`--pf-option-*`, `--pf-nav-item-*`);
 *   - a property an element sets inline from its own render (`style` objects
 *     and `setProperty`), such as a chart's computed dash offset.
 *
 * A `var(--x, fallback)` is allowed to name something undefined: that is what
 * the fallback is for, and several elements use it to offer an optional hook.
 *
 * Usage: node scripts/check-css-vars.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'packages/elements/src/components');
const tokensDir = path.join(root, 'packages/tokens/src/tokens');
const themeCss = path.join(root, 'packages/tokens/src/theme.css');

const kebab = (segment) => segment.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const defined = new Set();

function walkTokens(node, trail) {
  if (!node || typeof node !== 'object') return;
  if ('$value' in node) {
    defined.add(`--${trail.map(kebab).join('-')}`);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith('$')) walkTokens(value, [...trail, key]);
  }
}

for (const file of fs.readdirSync(tokensDir).filter((f) => f.endsWith('.json'))) {
  walkTokens(JSON.parse(fs.readFileSync(path.join(tokensDir, file), 'utf8')), []);
}

// Blanked rather than removed, so line numbers in the report still match the file.
const stripComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
const declarations = (css) => [...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]);

for (const name of declarations(stripComments(fs.readFileSync(themeCss, 'utf8')))) {
  defined.add(name);
}

const stylesheets = fs
  .readdirSync(componentsDir)
  .map((dir) => path.join(componentsDir, dir, `${dir}.css`))
  .filter((file) => fs.existsSync(file));

const sources = stylesheets.map((file) => ({
  file,
  css: stripComments(fs.readFileSync(file, 'utf8')),
}));
for (const { css } of sources) for (const name of declarations(css)) defined.add(name);

// Properties an element writes inline from its own render -- a computed dash
// offset, a gradient, a cell size -- are defined at runtime, on the element
// whose stylesheet reads them. Spec files are skipped: they read, not write.
for (const dir of fs.readdirSync(componentsDir)) {
  const tsx = path.join(componentsDir, dir, `${dir}.tsx`);
  if (!fs.existsSync(tsx)) continue;
  const source = fs.readFileSync(tsx, 'utf8');
  for (const match of source.matchAll(/['"`](--[\w-]+)['"`]\s*[:,]/g)) defined.add(match[1]);
}

const problems = [];
for (const { file, css } of sources) {
  // `var(--name)` closed straight away, with no fallback after a comma.
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
    if (defined.has(match[1])) continue;
    const line = css.slice(0, match.index).split('\n').length;
    problems.push(`${path.relative(root, file)}:${line}  ${match[1]}`);
  }
}

if (problems.length > 0) {
  console.error(
    `${problems.length} custom propert${problems.length === 1 ? 'y is' : 'ies are'} read with no ` +
      'fallback and defined nowhere -- each declaration computes to its initial value:\n' +
      problems.map((p) => `  ${p}`).join('\n') +
      '\n\nUse an alias that exists in packages/tokens/src/theme.css, add one there, or give the ' +
      'var() a fallback if the property is an optional hook.',
  );
  process.exit(1);
}

console.log(
  `check-css-vars: every var() without a fallback resolves (${stylesheets.length} stylesheets, ` +
    `${defined.size} defined names).`,
);
