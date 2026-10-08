#!/usr/bin/env node
/**
 * Condenses Stencil's `docs.json` into the element metadata the MCP server and
 * `llms.txt` answer from.
 *
 * `scripts/build-metadata.mjs` does this for the React library by parsing its
 * TypeScript, because nothing else records the API. For the elements that work
 * is already done: Stencil writes every prop, attribute, event, method, slot
 * and part into `docs.json` at build time. So this reads rather than parses,
 * and the only judgement it adds is the category — Stencil has no concept of
 * one, and an agent asking "what is there for navigation?" needs the two
 * layers to answer the same way.
 *
 * Output: packages/elements/dist/elements.json, published with the package and
 * bundled into @pitchfork-ui/mcp the same way metadata.json is.
 *
 * `--strict` fails on an element with no description, an unmapped category, or
 * an element whose React counterpart does not exist under the name claimed for
 * it. All three are things a new element gets wrong silently.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const elementsDir = join(root, 'packages/elements');
const docsJsonPath = join(elementsDir, 'dist/docs.json');
const reactMetadataPath = join(root, 'packages/react/dist/metadata.json');
const outFile = join(elementsDir, 'dist/elements.json');

const strict = process.argv.includes('--strict');
const warnings = [];
const warn = (message) => warnings.push(message);

const read = (path, howToBuild) => {
  if (!existsSync(path)) {
    console.error(
      `build-elements-metadata: ${path.slice(root.length + 1)} not found — ` +
        `run \`${howToBuild}\` first.`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
};

const docsJson = read(docsJsonPath, 'npm run build:elements');
const reactMetadata = read(reactMetadataPath, 'npm run build:metadata');
const elementsPkg = JSON.parse(readFileSync(join(elementsDir, 'package.json'), 'utf8'));

const reactByName = new Map(reactMetadata.components.map((c) => [c.name, c]));

/** `pf-nav-item` → `PfNavItem`, which is the name all three bindings use. */
const toPascal = (tag) =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * The React counterpart, where pascal-casing the tag does not find it.
 * Only acronyms and one deliberate rename, and `--strict` checks each name
 * still exists — a React component renamed out from under this table would
 * otherwise leave the element claiming a counterpart that is gone.
 */
const COUNTERPART = {
  'pf-inline-cta': 'InlineCTA',
  // The React layer puts the toast host in a provider; the element is the host
  // itself, because a custom element has no context to provide.
  'pf-toaster': 'ToastProvider',
};

/**
 * React components an element absorbed rather than mirrored one for one, with
 * how to get the same thing. Without this the metadata would answer "there is
 * no element for AreaChart", which is wrong in the way that matters: there is,
 * it is a prop. `--strict` fails on a React component that is in neither this
 * table nor a counterpart, so the claim that every React component has an
 * element answer stays true as components are added.
 */
const ABSORBED = {
  AreaChart: { tag: 'pf-line-chart', how: 'set `area` on `pf-line-chart`.' },
  CalendarGrid: {
    tag: 'pf-calendar',
    how: '`pf-calendar` is one element; the React layer splits the grid out as a sub-component.',
  },
  NotificationStack: {
    tag: 'pf-toaster',
    how: '`pf-toaster` is the positioned stack, with `placement` where the React component takes `position`.',
  },
  PageHeaderMeta: {
    tag: 'pf-page-header',
    how: "slot into `pf-page-header`'s `metadata` slot.",
  },
};

/**
 * Child elements, which have no React counterpart at all: the React component
 * takes an array where the element takes children (WEB-COMPONENTS-PLAN §2.1).
 * Mapped to their parent *tag* rather than to a category directly, so moving a
 * parent between categories takes its children with it.
 */
const CHILD_OF = {
  'pf-accordion-item': 'pf-accordion',
  'pf-breadcrumb': 'pf-breadcrumbs',
  'pf-button-group-item': 'pf-button-group',
  'pf-carousel-slide': 'pf-carousel',
  'pf-chart-series': 'pf-line-chart',
  'pf-command-group': 'pf-command-palette',
  'pf-command-item': 'pf-command-palette',
  'pf-menu-item': 'pf-context-menu',
  'pf-menu-separator': 'pf-context-menu',
  'pf-nav-item': 'pf-header-navigation',
  'pf-nav-section': 'pf-sidebar-navigation',
  'pf-option': 'pf-select',
  'pf-pie-slice': 'pf-pie-chart',
  'pf-progress-step': 'pf-progress-steps',
  'pf-radar-axis': 'pf-radar-chart',
  'pf-tab': 'pf-tabs',
  'pf-tab-panel': 'pf-tabs',
  'pf-table-cell': 'pf-table',
  'pf-table-row': 'pf-table',
  'pf-timeline-item': 'pf-timeline',
  'pf-tree-item': 'pf-tree-view',
};

/** The React component this element is the counterpart of, if there is one. */
function counterpartOf(tag) {
  if (CHILD_OF[tag]) return null;
  const name = COUNTERPART[tag] ?? toPascal(tag).replace(/^Pf/, '');
  if (reactByName.has(name)) return name;
  if (COUNTERPART[tag]) {
    warn(`${tag} claims a React counterpart named ${name}, which does not exist.`);
  }
  return null;
}

function categoryOf(tag) {
  const parent = CHILD_OF[tag];
  if (parent) {
    const category = categoryOf(parent);
    if (!category) warn(`${tag} is a child of ${parent}, which has no category.`);
    return category;
  }
  const counterpart = counterpartOf(tag);
  if (counterpart) return reactByName.get(counterpart).category;
  warn(
    `${tag} has no React counterpart and is not in CHILD_OF, so it has no ` +
      'category. Add it to one or the other.',
  );
  return null;
}

/**
 * A control that submits in a form, which is the single most consequential
 * thing about an element and the one thing `docs.json` does not record.
 * Read from the source, because `formAssociated` is a decorator option rather
 * than part of the public API Stencil documents.
 */
const isFormAssociated = (filePath) => {
  const source = join(elementsDir, filePath);
  return existsSync(source) && /formAssociated:\s*true/.test(readFileSync(source, 'utf8'));
};

/** Collapse a doc comment's hard wrapping; the prose is one paragraph of it. */
const clean = (text) => (text ?? '').replace(/\r\n/g, '\n').trim();

const elements = docsJson.components
  .map((component) => {
    const { tag } = component;
    const description = clean(component.docs);
    if (!description) warn(`${tag} has no doc comment.`);

    return {
      tag,
      name: toPascal(tag),
      category: categoryOf(tag),
      reactCounterpart: counterpartOf(tag),
      childOf: CHILD_OF[tag] ?? null,
      description,
      formAssociated: isFormAssociated(component.filePath),
      props: component.props.map((prop) => ({
        name: prop.name,
        // The attribute, where there is one. A prop typed as an object or an
        // array has no attribute at all, so a consumer writing HTML cannot set
        // it -- which is exactly what an agent needs to be told.
        attr: prop.attr ?? null,
        type: prop.type,
        default: prop.default ?? null,
        required: Boolean(prop.required),
        reflected: Boolean(prop.reflectToAttr),
        description: clean(prop.docs),
      })),
      events: component.events.map((event) => ({
        name: event.event,
        detail: event.detail || null,
        description: clean(event.docs),
      })),
      methods: component.methods.map((method) => ({
        name: method.name,
        signature: method.signature,
        description: clean(method.docs),
      })),
      slots: component.slots.map((slot) => ({
        // Stencil records the default slot as an empty name.
        name: slot.name || null,
        description: clean(slot.docs),
      })),
      parts: component.parts.map((part) => ({
        name: part.name,
        description: clean(part.docs),
      })),
    };
  })
  .sort((a, b) => a.tag.localeCompare(b.tag));

/*
 * What an agent holding a React component name needs: the element that answers
 * for it, whether that is a counterpart or an absorption.
 */
const elementByCounterpart = new Map(
  elements.filter((element) => element.reactCounterpart).map((e) => [e.reactCounterpart, e.tag]),
);

const reactCoverage = {};
for (const component of reactMetadata.components) {
  const counterpart = elementByCounterpart.get(component.name);
  if (counterpart) {
    reactCoverage[component.name] = { tag: counterpart };
    continue;
  }
  const absorbed = ABSORBED[component.name];
  if (absorbed) {
    reactCoverage[component.name] = { ...absorbed, absorbed: true };
    continue;
  }
  warn(
    `React ${component.name} has no element: no tag pascal-cases to it and it ` +
      'is not in ABSORBED. Port it, or record which element absorbed it.',
  );
}

for (const [name, { tag }] of Object.entries(ABSORBED)) {
  if (!reactByName.has(name)) warn(`ABSORBED names React ${name}, which does not exist.`);
  if (!elements.some((element) => element.tag === tag)) {
    warn(`ABSORBED points ${name} at ${tag}, which is not an element.`);
  }
}

const output = {
  $schema: 'https://lelandrangel.com/pitchfork-ui/schema/elements.json',
  name: elementsPkg.name,
  version: elementsPkg.version,
  generatedBy: 'scripts/build-elements-metadata.mjs',
  // The same taxonomy the React metadata uses, so one question gets one answer
  // whichever layer it is asked about.
  categories: reactMetadata.categories,
  bindings: {
    react: '@pitchfork-ui/elements-react',
    angular: '@pitchfork-ui/elements-angular',
    vue: '@pitchfork-ui/elements-vue',
  },
  reactCoverage,
  elements,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

const formAssociated = elements.filter((element) => element.formAssociated).length;
console.log(
  `elements metadata: ${elements.length} elements ` +
    `(${elements.filter((e) => e.reactCounterpart).length} with a React counterpart, ` +
    `${formAssociated} form-associated) → ${outFile.slice(root.length + 1)}`,
);
console.log(
  `  react coverage: ${Object.keys(reactCoverage).length}/${reactMetadata.components.length} ` +
    `components, ${Object.values(reactCoverage).filter((e) => e.absorbed).length} absorbed`,
);

if (warnings.length > 0) {
  console.error(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) console.error(`  - ${warning}`);
  if (strict) {
    console.error('\n--strict: failing.');
    process.exit(1);
  }
}
