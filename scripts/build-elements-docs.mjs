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
 *
 * Neither are the examples. `docs.json` knows every prop, slot and part and
 * has no idea that `pf-select` needs `pf-option` children or what a sensible
 * `data` array looks like, so a generated example would be
 * `<pf-line-chart></pf-line-chart>` -- an empty box. They live in
 * `apps/docs/src/element-examples.ts`, and this reads the keys out of it the
 * way `build-metadata.mjs` reads the icon lists out of `Icon.tsx`: by parsing
 * the source and throwing a named error when the shape it expects is not
 * there, so a rename is caught here rather than quietly producing 108 pages
 * with no previews on them.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsJsonPath = join(root, 'packages/elements/dist/docs.json');
const outDir = join(root, 'apps/docs/src/elements');

const strict = process.argv.includes('--strict');
const verify = process.argv.includes('--verify');

const examplesPath = join(root, 'apps/docs/src/element-examples.ts');

/**
 * The tags `element-examples.ts` has an example for.
 *
 * Parsed rather than imported, because this is a plain `.mjs` script and the
 * file is TypeScript importing a type. Only the keys are needed: the markup
 * itself never passes through here, which is what keeps the examples' quoting
 * and escaping entirely the TypeScript file's business.
 */
function readExampleTags() {
  const source = readFileSync(examplesPath, 'utf8');
  const body = source.match(
    /export const elementExamples: Record<string, ElementExample> = \{([\s\S]*)\n\};/,
  );
  if (!body) {
    throw new Error(
      `build-elements-docs: could not find the \`elementExamples\` object in ${examplesPath}. ` +
        'If it was renamed or its type annotation changed, update this parser to match — ' +
        'otherwise every page would silently lose its live preview.',
    );
  }
  const tags = new Set();
  for (const [, tag] of body[1].matchAll(/^ {2}'(pf-[a-z-]+)':/gm)) tags.add(tag);
  if (tags.size === 0) {
    throw new Error(
      `build-elements-docs: found \`elementExamples\` in ${examplesPath} but no \`'pf-*':\` keys ` +
        'at the top level. The indentation or quoting this parser expects has changed.',
    );
  }
  return tags;
}

const exampleTags = readExampleTags();

/**
 * The examples themselves, for the two questions the generated stories need
 * answering: does this element have its own `interactive` instance, and does
 * that instance hold text rather than child elements?
 *
 * Imported rather than parsed, where `readExampleTags` parses: Node strips the
 * types itself from 22.18 onwards and CI runs 24, so the real values are
 * available. The key parser stays because it is what produces the *named*
 * error when the file's shape changes -- an import would simply hand back an
 * empty object.
 */
const { elementExamples } = await import(examplesPath);

/** How many times the element appears in its own example. */
const occurrences = (tag, html) => (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;

/**
 * Whether a `children` control is safe to offer.
 *
 * An element's default slot is not part of its API the way React's `children`
 * prop is, so this is the one arg that is not a prop. Offering it means
 * assigning `textContent`, which would delete the child *elements* of a
 * composite instance -- so it is offered only where the documented element
 * holds text and nothing else.
 */
function holdsOnlyText(tag, html) {
  const open = new RegExp(`<${tag}(\\s[^>]*)?>`).exec(html);
  if (!open) return false;
  const start = open.index + open[0].length;
  const end = html.indexOf(`</${tag}>`, start);
  if (end === -1) return false;
  const inner = html.slice(start, end);
  return inner.trim().length > 0 && !inner.includes('<');
}

let docsJson;
try {
  docsJson = JSON.parse(readFileSync(docsJsonPath, 'utf8'));
} catch {
  console.error(
    `build-elements-docs: ${docsJsonPath} not found — run \`npm run build:elements\` first.`,
  );
  process.exit(1);
}

/** `pf-nav-item` → `PfNavItem`, which is the generated binding's name. */
const toPascal = (tag) =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * `pf-nav-item` → `NavItem`, the name these pages are filed under.
 *
 * The prefix is dropped now that the elements *are* the components and own the
 * `Components` section: a sidebar reading `PfButton` under `Components` would
 * be saying `pf-` twice.
 *
 * Only the page and the file lose it. The tag keeps it because a custom
 * element's name must contain a hyphen and `pf-` is this library's namespace
 * in a consumer's HTML, and the binding class keeps it because Stencil's
 * output targets derive `PfButton` from the tag. Every tag starts with `pf-`,
 * so no two pages can collide on the shortened name.
 */
const pageName = (tag) => toPascal(tag).replace(/^Pf/, '');

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

/**
 * The union members of a type as Stencil wrote it, with the absent cases
 * dropped.
 *
 * Stencil records the type as resolved text, so `variant` arrives as
 * `"danger" | "info"` -- note the **double** quotes, which is the shape that
 * made every element's variant check pass vacuously in the MCP validator
 * until `unionMembers` there accepted both. Accept both here for the same
 * reason.
 */
const typeMembers = (type) =>
  String(type ?? '')
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'undefined' && part !== 'null');

const STRING_LITERAL = /^(['"])(.*)\1$/;
const NUMBER_LITERAL = /^-?\d+(?:\.\d+)?$/;

/**
 * The control for a prop, from its type alone.
 *
 * `null` means no control: a prop typed as a function has nothing a panel can
 * usefully write, and offering an empty text box for one invites a reader to
 * type a string where the element expects a predicate.
 */
function controlFor(prop) {
  const members = typeMembers(prop.type);
  if (members.length === 0) return { control: 'text' };

  const strings = members.map((m) => STRING_LITERAL.exec(m)).filter(Boolean);
  if (strings.length === members.length) {
    return { control: 'select', options: strings.map((m) => m[2]) };
  }
  if (members.every((m) => NUMBER_LITERAL.test(m))) {
    return { control: 'select', options: members.map(Number) };
  }
  if (members.some((m) => m.includes('=>'))) return null;
  if (members.some((m) => m.endsWith('[]') || m.startsWith('Array<'))) {
    return { control: 'object' };
  }
  if (members.includes('boolean')) return { control: 'boolean' };
  if (members.includes('number')) return { control: 'number' };
  return { control: 'text' };
}

/**
 * A prop's default as a real value, or `undefined` to leave it out.
 *
 * `prop.default` is the source text, so `'Dismiss alert'` arrives with its
 * quotes on. Anything this cannot read confidently is omitted rather than
 * guessed: a missing arg leaves the element on its own default, where a wrong
 * one would quietly document the wrong starting state.
 */
function defaultArg(prop) {
  const text = String(prop.default ?? '').trim();
  if (!text || text === 'undefined' || text === 'null') return undefined;
  const asString = STRING_LITERAL.exec(text);
  if (asString) return asString[2];
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (NUMBER_LITERAL.test(text)) return Number(text);
  if (text === '[]') return [];
  return undefined;
}

/**
 * A JavaScript object literal, printed to be read.
 *
 * `JSON.stringify` would do, and these files are in `.prettierignore` because
 * `--verify` compares the generator's own bytes -- so nothing would reformat
 * double-quoted keys afterwards. Someone opening one of these to see what a
 * control does should not have to read JSON.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function literal(value, indent = '  ') {
  if (value === null) return 'null';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value !== 'object') return String(value);

  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const parts = value.map((item) => literal(item, inner));
    const oneLine = `[${parts.join(', ')}]`;
    if (oneLine.length + indent.length <= 92) return oneLine;
    return `[\n${parts.map((part) => `${inner}${part}`).join(',\n')},\n${indent}]`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const parts = entries.map(
    ([key, item]) => `${IDENTIFIER.test(key) ? key : `'${key}'`}: ${literal(item, inner)}`,
  );
  const oneLine = `{ ${parts.join(', ')} }`;
  if (oneLine.length + indent.length <= 92) return oneLine;
  return `{\n${parts.map((part) => `${inner}${part}`).join(',\n')},\n${indent}}`;
}

/**
 * The attributes the instance already sets, as args.
 *
 * Without this the panel and the element disagree: `pf-alert`'s instance
 * carries `heading="Scheduled maintenance"`, which the element renders, while
 * `heading` has no default in `docs.json` and so would show as an empty text
 * box. A reader would see a heading on screen and an empty control claiming to
 * be it. The attribute is the truth about what is rendered, so it wins over
 * the prop's declared default.
 */
function argsFromInstance(component, html) {
  const open = new RegExp(`<${component.tag}(\\s[^>]*)?>`).exec(html);
  if (!open || !open[1]) return {};

  const byAttr = new Map(
    (component.props ?? []).filter((prop) => prop.attr).map((prop) => [prop.attr, prop]),
  );

  const args = {};
  for (const match of open[1].matchAll(/([A-Za-z_][\w-]*)(?:=("([^"]*)"|'([^']*)'))?/g)) {
    const [, attr, , doubleQuoted, singleQuoted] = match;
    const prop = byAttr.get(attr);
    if (!prop) continue;
    const raw = doubleQuoted ?? singleQuoted;
    const control = controlFor(prop);

    // A bare attribute is `true`; `="false"` is the only falsy spelling.
    if (control?.control === 'boolean') {
      args[prop.name] = raw === undefined ? true : raw !== 'false';
      continue;
    }
    if (raw === undefined) continue;
    if (control?.control === 'number' || control?.options?.every((o) => typeof o === 'number')) {
      const asNumber = Number(raw);
      if (!Number.isNaN(asNumber)) args[prop.name] = asNumber;
      continue;
    }
    if (control?.control === 'object') {
      // Only if it really is JSON -- `data='[["Mon", 12]]'` is, a bare
      // `var(--color-brand-500)` is not, and a half-parsed value in the panel
      // would be worse than none.
      try {
        args[prop.name] = JSON.parse(raw);
      } catch {
        /* leave it out */
      }
      continue;
    }
    args[prop.name] = raw;
  }
  return args;
}

/**
 * The `Interactive` story: one element with its properties on the controls
 * panel, which is the shape `Components/Button` has on the React side.
 *
 * `argTypes` come from `docs.json` rather than from Storybook's inference,
 * because there is nothing for it to infer -- a custom element exposes no
 * props a React renderer can read. Every documented prop is offered, including
 * the ones a parent normally sets (`pf-pie-slice.drawn`,
 * `pf-table-row.odd`): they are real props, the reference table above lists
 * them, and a hand-maintained list of exceptions would be judgement with no
 * check behind it.
 */
function storiesFor(component) {
  const name = pageName(component.tag);
  const example = elementExamples[component.tag];
  const html = example?.interactive ?? example?.html ?? '';

  const args = {};
  const argTypes = {};

  if (holdsOnlyText(component.tag, html)) {
    const open = new RegExp(`<${component.tag}(\\s[^>]*)?>`).exec(html);
    const start = open.index + open[0].length;
    args.children = html.slice(start, html.indexOf(`</${component.tag}>`, start)).trim();
    argTypes.children = { control: 'text' };
  }

  for (const prop of (component.props ?? []).filter((p) => !p.internal)) {
    const control = controlFor(prop);
    argTypes[prop.name] = control ?? { control: false };
    const value = defaultArg(prop);
    if (value !== undefined) args[prop.name] = value;
  }

  Object.assign(args, argsFromInstance(component, html));

  return `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['${component.tag}'];

const meta = {
  title: 'Components/${name}',
  args: ${literal(args)},
  argTypes: ${literal(argTypes)},
  render: (args) => (
    <ElementPlayground
      tag="${component.tag}"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
`;
}

function pageFor(component) {
  const name = pageName(component.tag);
  const sections = [];

  const hasExample = exampleTags.has(component.tag);

  // `<Meta of={...}>` rather than a title, which is what puts Docs and
  // Interactive under one sidebar entry -- the shape Components/Button has.
  sections.push(`import { Meta } from '@storybook/addon-docs/blocks';${
    hasExample
      ? `
import { ElementPreview } from '../ElementPreview';
import { elementExamples } from '../element-examples';`
      : ''
  }
import * as ${name}Stories from './${name}.stories';

<Meta of={${name}Stories} />

{/*
  Generated from packages/elements/dist/docs.json by
  scripts/build-elements-docs.mjs. Edit the component's doc comments, not
  this file — CI fails if the two disagree. The example comes from
  apps/docs/src/element-examples.ts; edit it there.
*/}

# \`<${component.tag}>\`
`);

  if (component.docs) sections.push(blockProse(component.docs));

  // Before the tables, because a reader deciding whether to move off the React
  // component wants to see the element first.
  if (hasExample) {
    sections.push(`## Example

<ElementPreview example={elementExamples['${component.tag}']} />`);
  }

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
const expected = new Map();
for (const component of components) {
  const name = pageName(component.tag);
  expected.set(`${name}.mdx`, pageFor(component));
  // One stories file per element, so the MDX has something to attach to.
  if (exampleTags.has(component.tag)) {
    expected.set(`${name}.stories.tsx`, storiesFor(component));
  }
}

if (verify) {
  let existing = [];
  try {
    existing = readdirSync(outDir).filter(
      (file) => file.endsWith('.mdx') || file.endsWith('.stories.tsx'),
    );
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
    console.error(`\n--verify: ${problems.length} generated element file(s) out of date:`);
    for (const problem of problems.slice(0, 20)) console.error(`  - ${problem}`);
    console.error('\nRun `npm run build:elements-docs` and commit the result.');
    process.exit(1);
  }

  console.log(`--verify: all ${expected.size} generated element files are up to date.`);
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
const unexampled = components.filter((component) => !exampleTags.has(component.tag));
const orphanExamples = [...exampleTags].filter(
  (tag) => !components.some((component) => component.tag === tag),
);

if (strict && undocumented.length > 0) {
  console.error(`\n--strict: ${undocumented.length} element(s) have no doc comment:`);
  for (const component of undocumented.slice(0, 20)) console.error(`  - ${component.tag}`);
  process.exit(1);
}

// Controls that drive the first of six buttons, while five sit unchanged, are
// worse than no controls -- so an example showing the element more than once
// has to name the single instance the Interactive story uses. Where it appears
// once the example *is* that instance, and requiring a copy would only invite
// the copy to drift.
const needInteractive = components.filter((component) => {
  const example = elementExamples[component.tag];
  if (!example || example.interactive) return false;
  return occurrences(component.tag, example.html) > 1;
});

if (strict && needInteractive.length > 0) {
  console.error(
    `\n--strict: ${needInteractive.length} element(s) show themselves more than once in their ` +
      `example and need an \`interactive\` instance in ${examplesPath}:`,
  );
  for (const component of needInteractive.slice(0, 20)) {
    console.error(`  - ${component.tag}`);
  }
  process.exit(1);
}

// A page with no preview is a table describing an element the page cannot
// render, which is the state this whole mechanism exists to end. An example
// for an element that no longer exists is the same mistake pointing the other
// way, and would otherwise sit there unnoticed for ever.
if (strict && (unexampled.length > 0 || orphanExamples.length > 0)) {
  if (unexampled.length > 0) {
    console.error(
      `\n--strict: ${unexampled.length} element(s) have no example in ${examplesPath}:`,
    );
    for (const component of unexampled.slice(0, 20)) console.error(`  - ${component.tag}`);
  }
  if (orphanExamples.length > 0) {
    console.error(
      `\n--strict: ${orphanExamples.length} example(s) name an element that does not exist:`,
    );
    for (const tag of orphanExamples.slice(0, 20)) console.error(`  - ${tag}`);
  }
  process.exit(1);
}

const pages = components.length;
const stories = expected.size - pages;
console.log(
  `build-elements-docs: wrote ${pages} element pages and ${stories} Interactive stories ` +
    `to apps/docs/src/elements` +
    (undocumented.length > 0 ? ` (${undocumented.length} with no doc comment)` : '') +
    (unexampled.length > 0 ? ` (${unexampled.length} with no example)` : ''),
);
