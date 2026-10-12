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
 * Three questions, and the last two are the cheap ones worth having:
 *
 * 1. Does the markup check out against `elements.json`? Unknown tags,
 *    attributes that do not exist, invalid enum values, and props with no
 *    attribute at all.
 * 2. Does each example actually contain the element its page documents? An
 *    example copied from a sibling renders perfectly and documents the wrong
 *    thing, and nothing else here would notice.
 * 3. Does a cartesian chart's `data` match the series keyed off it? This is
 *    the one thing here that is about a *value* rather than a name, and it is
 *    here because all four chart examples were wrong: they were written as
 *    `[["Mon", 12], …]` tuples against a `series-key="0"`, where a row is
 *    `{ label } & Record<string, number>`. Measured in a real build rather
 *    than reasoned about: the line chart drew a **flat line on the baseline**
 *    with y-ticks 0-5 and blank x labels, and the bar chart drew one of its
 *    two series, because `series-key="1"` happened to land on the first
 *    number while `"0"` landed on the label and came out `NaN`. Every
 *    attribute in all four is valid, so questions 1 and 2 pass them.
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

/**
 * A cartesian chart's rows and the series keyed off them.
 *
 * `pf-line-chart` and `pf-bar-chart` share `pf-chart-series`, and share the
 * row type: `{ label: string } & Record<string, number>`. Both read
 * `row.label` for the x axis and `row[seriesKey]` for the value, and both fail
 * **silently** when handed something else -- a missing `label` renders an
 * empty `<text>`, and a missing key goes through `Number(undefined) || 0` to
 * the baseline. So the markup validates and the chart is blank.
 *
 * Regexes rather than a parser: this is hand-written markup a few lines long,
 * and the alternative is a DOM dependency for one check. The non-greedy body
 * match is safe because a chart never nests a chart.
 */
const CHART_TAGS = ['pf-line-chart', 'pf-bar-chart'];

function checkChartData(markup, where) {
  const found = [];

  for (const tag of CHART_TAGS) {
    const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'g');
    for (const match of markup.matchAll(pattern)) {
      const [, attributes, body] = match;

      const dataMatch = /\bdata='([^']*)'/.exec(attributes) ?? /\bdata="([^"]*)"/.exec(attributes);
      const keys = [...body.matchAll(/series-key="([^"]*)"/g)].map((m) => m[1]);

      if (keys.length === 0) {
        found.push(
          `${where}: <${tag}> has no <pf-chart-series> child, so it renders its empty state.`,
        );
        continue;
      }

      // No `data` attribute at all is legitimate: `interactive` instances and
      // the patterns may assign the property in `setup` instead.
      if (!dataMatch) continue;

      let rows;
      try {
        rows = JSON.parse(dataMatch[1]);
      } catch (error) {
        found.push(`${where}: <${tag}> data is not valid JSON (${error.message}).`);
        continue;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        found.push(`${where}: <${tag}> data is not a non-empty array of rows.`);
        continue;
      }

      rows.forEach((row, index) => {
        if (Array.isArray(row) || typeof row !== 'object' || row === null) {
          found.push(
            `${where}: <${tag}> data row ${index} is ${
              Array.isArray(row) ? 'an array' : typeof row
            }, not an object. A row is \`{ label, [seriesKey]: number }\` — a tuple draws ` +
              'a flat line with blank axis labels.',
          );
          return;
        }

        if (typeof row.label !== 'string' || row.label.length === 0) {
          found.push(
            `${where}: <${tag}> data row ${index} has no \`label\`, so its x-axis tick is blank.`,
          );
        }

        for (const key of keys) {
          if (!(key in row)) {
            found.push(
              `${where}: <${tag}> has series-key="${key}", which row ${index} does not have. ` +
                `It plots as 0. Row ${index} has: ${Object.keys(row).join(', ') || '(nothing)'}.`,
            );
          } else if (!Number.isFinite(Number(row[key]))) {
            found.push(
              `${where}: <${tag}> row ${index}'s "${key}" is ${JSON.stringify(row[key])}, ` +
                'which is not a number. It plots as 0.',
            );
          }
        }
      });
    }
  }

  return found;
}

for (const [tag, example] of Object.entries(elementExamples)) {
  for (const [field, markup] of [
    ['html', example.html],
    ['interactive', example.interactive],
  ]) {
    if (!markup) continue;
    const where = field === 'html' ? tag : `${tag} (interactive)`;
    errors.push(...checkChartData(markup, where));
  }
}

for (const [name, pattern] of Object.entries(patternMarkup)) {
  errors.push(...checkChartData(pattern.html, `pattern ${name}`));
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
