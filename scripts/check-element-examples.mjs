#!/usr/bin/env node
/**
 * Checks the live examples on the generated element reference pages against
 * the real element API.
 *
 * `validate_usage` exists so an agent can check the markup it wrote before
 * presenting it. Nothing checked ours — which is the same gap
 * `check-icon-names.mjs` was written to close, and it bit here immediately:
 * the first draft of `element-examples.ts` had nine wrong enum values, among
 * them `trend="up"` where `pf-metric-card` takes `positive`,
 * `variant="pill"` where `pf-tabs` takes `pills`, and `sort="asc"` on
 * `pf-table-cell`, which takes the aria-sort vocabulary (`ascending`) while
 * the table's own `sort-direction` really is `asc`. Every one of them parses,
 * renders, and silently does nothing — a docs site demonstrating broken usage,
 * exactly what `check:icons` found in the React examples.
 *
 * Two questions, and the second is the cheap one worth having:
 *
 * 1. Does the markup check out against `elements.json`? Unknown tags,
 *    attributes that do not exist, invalid enum values, and props with no
 *    attribute at all.
 * 2. Does each example actually contain the element its page documents? An
 *    example copied from a sibling renders perfectly and documents the wrong
 *    thing, and nothing else here would notice.
 *
 * The examples are TypeScript and this imports them directly: Node strips the
 * types itself from 22.18 onwards, and CI runs 24.
 */
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import {
  elementsByTag,
  iconNames,
  iconRegistryAvailable,
  componentsByName,
  resolvesIconName,
} from '../packages/mcp/src/data.mjs';
import { validateUsage } from '../packages/mcp/src/validate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const examplesPath = resolve(root, 'apps/docs/src/element-examples.ts');
const patternsPath = resolve(root, 'apps/docs/src/patterns/pattern-markup.ts');
const { elementExamples } = await import(examplesPath);
const { patternMarkup } = await import(patternsPath);

const errors = [];
const warnings = [];

for (const [tag, example] of Object.entries(elementExamples)) {
  if (!elementsByTag.has(tag)) {
    errors.push(`${tag}: no such element. The generator's --strict reports this too.`);
    continue;
  }

  // Both strings, because both are markup a reader sees: `html` on the
  // reference page and `interactive` behind the controls panel. Checking only
  // `html` would have left 48 hand-written instances unvalidated, which is
  // precisely the state that put nine wrong enum values in the first draft.
  for (const [field, markup] of [
    ['html', example.html],
    ['interactive', example.interactive],
  ]) {
    if (!markup) continue;
    const where = field === 'html' ? tag : `${tag} (interactive)`;

    if (!new RegExp(`<${tag}[\\s>]`).test(markup)) {
      errors.push(`${where}: never renders <${tag}>. It documents a different element.`);
    }

    const findings = validateUsage(
      markup,
      componentsByName,
      { available: iconRegistryAvailable, resolves: resolvesIconName, names: iconNames },
      elementsByTag,
    );
    for (const finding of findings) {
      (finding.severity === 'error' ? errors : warnings).push(`${where}: ${finding.message}`);
    }
  }
}

// The seven worked compositions get the same treatment, and need it more:
// each one puts a dozen elements together, so a wrong attribute has a dozen
// chances to hide. These are markup the docs site presents as the way to
// build something, which is exactly what `validate_usage` is for.
for (const [name, pattern] of Object.entries(patternMarkup)) {
  const findings = validateUsage(
    pattern.html,
    componentsByName,
    { available: iconRegistryAvailable, resolves: resolvesIconName, names: iconNames },
    elementsByTag,
  );
  for (const finding of findings) {
    (finding.severity === 'error' ? errors : warnings).push(`pattern ${name}: ${finding.message}`);
  }
}

const count = Object.keys(elementExamples).length;
const patterns = Object.keys(patternMarkup).length;
const where = relative(root, examplesPath);

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s) in ${where}:`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) in ${where}:`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    '\nThese render without complaint and do nothing, so the docs site would ' +
      'demonstrate markup that cannot work. Fix the example.',
  );
  process.exit(1);
}

console.log(
  `check-element-examples: ${count} element examples, every \`interactive\` instance beside ` +
    `them, and ${patterns} patterns check out against elements.json` +
    (warnings.length > 0 ? ` (${warnings.length} warning(s) above)` : ''),
);
