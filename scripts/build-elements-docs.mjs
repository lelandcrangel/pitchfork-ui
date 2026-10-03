#!/usr/bin/env node
/**
 * Generates one Storybook docs page per custom element from Stencil's own
 * `docs.json`.
 *
 * Generated rather than hand-written, and that is the point: there are 108
 * elements, and a prop table written by hand is a prop table that is wrong by
 * the second release. Stencil already records every prop, event, method, slot
 * and part from the source, so the reference cannot drift from the code — and
 * `--verify` fails the build when the committed pages are stale, which is the
 * failure mode the generated CHANGELOG page had.
 *
 * The *prose* is not generated: `WebComponents.mdx` is hand-written, because
 * the interesting part of this package is the handful of places the element
 * API deliberately differs from the React one, and no generator knows that.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsJsonPath = join(root, 'packages/elements/dist/docs.json');
const outDir = join(root, 'apps/docs/src/elements');

const strict = process.argv.includes('--strict');
const verify = process.argv.includes('--verify');

let docsJson;
try {
  docsJson = JSON.parse(readFileSync(docsJsonPath, 'utf8'));
} catch {
  console.error(
    `build-elements-docs: ${docsJsonPath} not found — run \`npm run build:elements\` first.`,
  );
  process.exit(1);
}

/** `pf-nav-item` → `PfNavItem`, which is both the page name and the binding's. */
const toPascal = (tag) =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * MDX is JSX, so a brace or an angle bracket in a doc comment is parsed as an
 * expression or a tag. Inside a table cell the text is inline MDX, so it has
 * to be escaped rather than fenced.
 */
const inlineCell = (text) =>
  (text ?? '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .replace(/[{}]/g, (brace) => `\\${brace}`)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

/** A type or default, which is always code and so needs no further escaping. */
const codeCell = (text) => {
  const value = inlineCell(text);
  return value ? `\`${value.replace(/`/g, '')}\`` : '—';
};

/**
 * Block prose, with newlines kept so a multi-paragraph doc comment stays
 * readable.
 *
 * Only the text *outside* markdown code spans is escaped. These comments are
 * full of `<pf-tooltip>` and `<a routerLink>` written inside backticks, where
 * MDX already treats the content as literal — escaping there renders
 * `&lt;Link>` as visible mojibake, and *not* escaping outside there lets MDX
 * parse `<Link>` as a component and fail the build. The first draft of this
 * did both wrong in the same file.
 */
const blockProse = (text) => {
  const escapeOutsideCode = (chunk) =>
    chunk.replace(/[{}]/g, (brace) => `\\${brace}`).replace(/</g, '&lt;');

  // Split on code spans and fenced blocks, keeping them in the result.
  const parts = (text ?? '').split(/(```[\s\S]*?```|`[^`]*`)/g);
  return parts
    .map((part, index) => (index % 2 === 1 ? part : escapeOutsideCode(part)))
    .join('')
    .trim();
};

const table = (headers, rows) =>
  rows.length === 0
    ? ''
    : [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.join(' | ')} |`),
      ].join('\n');

function pageFor(component) {
  const name = toPascal(component.tag);
  const sections = [];

  sections.push(`import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Web components/${name}" />

{/*
  Generated from packages/elements/dist/docs.json by
  scripts/build-elements-docs.mjs. Edit the component's doc comments, not
  this file — CI fails if the two disagree.
*/}

# \`<${component.tag}>\`
`);

  if (component.docs) sections.push(blockProse(component.docs));

  const props = (component.props ?? []).filter((prop) => !prop.internal);
  if (props.length > 0) {
    sections.push(
      `## Properties\n\n${table(
        ['Property', 'Attribute', 'Type', 'Default', 'Description'],
        props.map((prop) => [
          `\`${prop.name}\``,
          prop.attr ? `\`${prop.attr}\`` : '—',
          codeCell(prop.type),
          codeCell(prop.default),
          inlineCell(prop.docs) || '—',
        ]),
      )}`,
    );
  }

  if ((component.events ?? []).length > 0) {
    sections.push(
      `## Events\n\n${table(
        ['Event', 'Detail', 'Description'],
        component.events.map((event) => [
          `\`${event.event}\``,
          codeCell(event.detail),
          inlineCell(event.docs) || '—',
        ]),
      )}`,
    );
  }

  if ((component.methods ?? []).length > 0) {
    sections.push(
      `## Methods\n\n${table(
        ['Method', 'Signature', 'Description'],
        component.methods.map((method) => [
          `\`${method.name}()\``,
          codeCell(method.signature),
          inlineCell(method.docs) || '—',
        ]),
      )}`,
    );
  }

  if ((component.slots ?? []).length > 0) {
    sections.push(
      `## Slots\n\n${table(
        ['Slot', 'Description'],
        component.slots.map((slot) => [
          slot.name ? `\`${slot.name}\`` : '_(default)_',
          inlineCell(slot.docs) || '—',
        ]),
      )}`,
    );
  }

  if ((component.parts ?? []).length > 0) {
    sections.push(
      `## Shadow parts\n\n${table(
        ['Part', 'Description'],
        component.parts.map((part) => [`\`${part.name}\``, inlineCell(part.docs) || '—']),
      )}`,
    );
  }

  sections.push(`## Usage

\`\`\`html
<!-- Plain HTML, after \`import '@pitchfork-ui/elements/loader'\` -->
<${component.tag}></${component.tag}>
\`\`\`

\`\`\`tsx
// React, through the generated bindings
import { ${name} } from '@pitchfork-ui/elements-react';

<${name} />;
\`\`\`

\`\`\`html
<!-- Angular, through the generated standalone components -->
<${component.tag}></${component.tag}>
\`\`\`
`);

  return `${sections.join('\n\n')}\n`;
}

const components = [...docsJson.components].sort((a, b) => a.tag.localeCompare(b.tag));
const expected = new Map(
  components.map((component) => [`${toPascal(component.tag)}.mdx`, pageFor(component)]),
);

if (verify) {
  let existing = [];
  try {
    existing = readdirSync(outDir).filter((file) => file.endsWith('.mdx'));
  } catch {
    console.error(`\n--verify: ${outDir} does not exist — run \`npm run build:elements-docs\`.`);
    process.exit(1);
  }

  const problems = [];
  for (const [file, contents] of expected) {
    if (!existing.includes(file)) {
      problems.push(`${file} is missing`);
      continue;
    }
    const onDisk = readFileSync(join(outDir, file), 'utf8');
    if (onDisk !== contents) problems.push(`${file} is stale`);
  }
  for (const file of existing) {
    if (!expected.has(file)) problems.push(`${file} documents an element that no longer exists`);
  }

  if (problems.length > 0) {
    console.error(`\n--verify: ${problems.length} generated element page(s) out of date:`);
    for (const problem of problems.slice(0, 20)) console.error(`  - ${problem}`);
    console.error('\nRun `npm run build:elements-docs` and commit the result.');
    process.exit(1);
  }

  console.log(`--verify: all ${expected.size} generated element pages are up to date.`);
  process.exit(0);
}

/*
 * The directory is rebuilt rather than written over: a renamed element would
 * otherwise leave its old page behind, documenting a tag that no longer
 * exists.
 */
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [file, contents] of expected) writeFileSync(join(outDir, file), contents);

const undocumented = components.filter((component) => !component.docs);
if (strict && undocumented.length > 0) {
  console.error(`\n--strict: ${undocumented.length} element(s) have no doc comment:`);
  for (const component of undocumented.slice(0, 20)) console.error(`  - ${component.tag}`);
  process.exit(1);
}

console.log(
  `build-elements-docs: wrote ${expected.size} element pages to apps/docs/src/elements` +
    (undocumented.length > 0 ? ` (${undocumented.length} with no doc comment)` : ''),
);
