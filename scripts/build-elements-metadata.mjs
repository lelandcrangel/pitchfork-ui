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
import { readIconRegistry } from './lib/icon-registry.mjs';
import {
  ELEMENT_CONVENTION_SECTIONS,
  readConventions,
  readMdxConventions,
} from './lib/conventions.mjs';

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
const elementsPkg = JSON.parse(readFileSync(join(elementsDir, 'package.json'), 'utf8'));

/*
 * The React metadata is **optional**, and this is the whole shape of Phase 5
 * in one place. It used to be required, and every element's category came out
 * of it, so `packages/react` going away took the taxonomy with it and left
 * `--strict` failing with no categories at all.
 *
 * Now it is only ever used to *check* this file's own tables -- the counterpart
 * names, the absorptions, and the category of each element. While it is on
 * disk those checks run and the tables cannot drift. Once it is gone the
 * output is the same minus `reactCoverage`, which is the one part that is
 * genuinely about React and has nothing left to describe.
 */
const reactMetadata = existsSync(reactMetadataPath)
  ? JSON.parse(readFileSync(reactMetadataPath, 'utf8'))
  : null;

const reactByName = new Map((reactMetadata?.components ?? []).map((c) => [c.name, c]));

/** `pf-nav-item` → `PfNavItem`, which is the name all three bindings use. */
const toPascal = (tag) =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * The ten categories, in the order an agent should read them.
 *
 * Owned here rather than read out of the React metadata, which is where they
 * used to come from: the elements are the layer that survives, so the taxonomy
 * has to live with them. The order is deliberate -- `list_elements` groups by
 * it, and "forms, actions, display" is the order someone building a screen
 * works in, not alphabetical.
 */
const CATEGORIES = [
  'forms',
  'actions',
  'display',
  'navigation',
  'overlays',
  'feedback',
  'dataviz',
  'media',
  'layout',
  'utility',
];

/**
 * Which category each element belongs to.
 *
 * This table used to be derived: an element took its React counterpart's
 * category, and a child element took its parent's. The second half still
 * holds (`CHILD_OF` below), and it is the better rule -- a child has no
 * category of its own to get wrong. The first half cannot survive
 * `packages/react`, so the 87 non-child elements are written down.
 *
 * Generated from the React-derived output rather than retyped, and
 * `checkAgainstReact` below asserts the two still agree for as long as the
 * React metadata is on disk. So this cannot drift while there is something to
 * drift from, and when there is not, it is the source.
 *
 * `--strict` fails on an element in neither this table nor `CHILD_OF`, which
 * is the same check as before against a different table: a new element with no
 * category is the thing that goes wrong silently.
 */
const CATEGORY = {
  // forms
  'pf-checkbox': 'forms',
  'pf-combobox': 'forms',
  'pf-date-picker': 'forms',
  'pf-date-range-picker': 'forms',
  'pf-file-uploader': 'forms',
  'pf-input': 'forms',
  'pf-multi-select': 'forms',
  'pf-number-input': 'forms',
  'pf-radio-button': 'forms',
  'pf-radio-group': 'forms',
  'pf-rating-badge': 'forms',
  'pf-rating-stars': 'forms',
  'pf-rich-text-editor': 'forms',
  'pf-select': 'forms',
  'pf-slider': 'forms',
  'pf-switch': 'forms',
  'pf-tag-input': 'forms',
  'pf-textarea': 'forms',
  'pf-time-picker': 'forms',

  // actions
  'pf-button': 'actions',
  'pf-button-group': 'actions',
  'pf-inline-cta': 'actions',
  'pf-kbd': 'actions',
  'pf-utility-button': 'actions',

  // display
  'pf-accordion': 'display',
  'pf-avatar': 'display',
  'pf-avatar-group': 'display',
  'pf-badge': 'display',
  'pf-badge-group': 'display',
  'pf-card': 'display',
  'pf-card-content': 'display',
  'pf-card-footer': 'display',
  'pf-card-header': 'display',
  'pf-code-snippet': 'display',
  'pf-collapsible': 'display',
  'pf-content-divider': 'display',
  'pf-credit-card': 'display',
  'pf-empty-state': 'display',
  'pf-icon': 'display',
  'pf-metric-card': 'display',
  'pf-metric-grid': 'display',
  'pf-tag': 'display',
  'pf-timeline': 'display',
  'pf-tooltip': 'display',

  // navigation
  'pf-breadcrumbs': 'navigation',
  'pf-header-navigation': 'navigation',
  'pf-pagination': 'navigation',
  'pf-progress-steps': 'navigation',
  'pf-sidebar-navigation': 'navigation',
  'pf-tabs': 'navigation',
  'pf-toolbar': 'navigation',
  'pf-toolbar-separator': 'navigation',
  'pf-tree-view': 'navigation',

  // overlays
  'pf-calendar': 'overlays',
  'pf-command-palette': 'overlays',
  'pf-context-menu': 'overlays',
  'pf-dropdown': 'overlays',
  'pf-modal': 'overlays',
  'pf-modal-body': 'overlays',
  'pf-modal-footer': 'overlays',
  'pf-modal-header': 'overlays',
  'pf-notification': 'overlays',
  'pf-popover': 'overlays',
  'pf-slideout-menu': 'overlays',
  'pf-toaster': 'overlays',

  // feedback
  'pf-alert': 'feedback',
  'pf-gauge-chart': 'feedback',
  'pf-loading-dots': 'feedback',
  'pf-loading-skeleton': 'feedback',
  'pf-loading-spinner': 'feedback',
  'pf-progress-bar': 'feedback',
  'pf-progress-circle': 'feedback',

  // dataviz
  'pf-bar-chart': 'dataviz',
  'pf-heatmap': 'dataviz',
  'pf-line-chart': 'dataviz',
  'pf-pie-chart': 'dataviz',
  'pf-radar-chart': 'dataviz',
  'pf-sparkline': 'dataviz',
  'pf-table': 'dataviz',

  // media
  'pf-carousel': 'media',
  'pf-video-player': 'media',

  // layout
  'pf-page-header': 'layout',
  'pf-resizable': 'layout',
  'pf-scroll-area': 'layout',
  'pf-section-footer': 'layout',
  'pf-section-header': 'layout',

  // utility
  'pf-visually-hidden': 'utility',
};

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

/**
 * The React component this element is the counterpart of, if there is one.
 *
 * `null` for every element once the React metadata is gone, which is correct
 * rather than a degradation: there is no counterpart to point at. The
 * `COUNTERPART` warning is only raised while there is a list to check against,
 * or it would fire for all 108.
 */
function counterpartOf(tag) {
  if (!reactMetadata || CHILD_OF[tag]) return null;
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
  if (CATEGORY[tag]) return CATEGORY[tag];
  warn(
    `${tag} is in neither CATEGORY nor CHILD_OF, so it has no category. ` +
      'Add it to one or the other.',
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

const examplesPath = join(root, 'apps/docs/src/element-examples.ts');

/**
 * The worked markup for each element, from the one place it is written down.
 *
 * `docs.json` has every prop and slot and no idea that `pf-select` needs
 * `pf-option` children, so the examples are hand-written in
 * `apps/docs/src/element-examples.ts` for the reference pages. An agent asking
 * `get_examples` needs the same thing, and a second copy written for the MCP
 * server would be a second copy to drift -- the React half got its examples by
 * parsing the docs app's stories for exactly this reason.
 *
 * Imported rather than parsed: Node strips the types itself from 22.18 onwards
 * and CI runs 24. A named error when the export is gone, because an empty
 * object would silently publish metadata with no examples in it -- the same
 * failure `build-metadata.mjs` guards against for the icon lists.
 */
async function readExamples() {
  const module = await import(examplesPath);
  const examples = module.elementExamples;
  if (!examples || typeof examples !== 'object' || Object.keys(examples).length === 0) {
    throw new Error(
      `build-elements-metadata: no \`elementExamples\` export in ${examplesPath}. ` +
        'If it was renamed, update this import — otherwise every element would ' +
        'ship with no example.',
    );
  }
  return examples;
}

const elementExamples = await readExamples();

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
      // `example` is the markup the reference page shows, which may hold
      // several variants. `interactive` is the single instance the Interactive
      // story drives, and it is absent where the example already is one --
      // `example` is then the answer to both questions, so there is nothing to
      // repeat here either.
      example: clean(elementExamples[tag]?.html) || null,
      interactive: clean(elementExamples[tag]?.interactive) || null,
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
for (const component of reactMetadata?.components ?? []) {
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
  if (reactMetadata && !reactByName.has(name)) {
    warn(`ABSORBED names React ${name}, which does not exist.`);
  }
  if (!elements.some((element) => element.tag === tag)) {
    warn(`ABSORBED points ${name} at ${tag}, which is not an element.`);
  }
}

/*
 * The table above against the derivation it replaced, for as long as there is
 * something to compare with.
 *
 * `CATEGORY` was generated from this script's own React-derived output, so the
 * two agree today by construction. What this catches is the gap afterwards: a
 * React component moved between categories, or a new element added to
 * `CATEGORY` under a category its counterpart does not share. Either would be
 * a silent disagreement between two layers that are supposed to answer one
 * question the same way -- and once `packages/react` is gone there is no way
 * to notice it at all, so it is worth noticing now.
 */
if (reactMetadata) {
  for (const element of elements) {
    if (!element.reactCounterpart) continue;
    const theirs = reactByName.get(element.reactCounterpart)?.category;
    if (theirs && theirs !== element.category) {
      warn(
        `${element.tag} is "${element.category}" in CATEGORY but its React ` +
          `counterpart ${element.reactCounterpart} is "${theirs}".`,
      );
    }
  }

  const missing = reactMetadata.categories.filter((name) => !CATEGORIES.includes(name));
  const extra = CATEGORIES.filter((name) => !reactMetadata.categories.includes(name));
  if (missing.length > 0 || extra.length > 0) {
    warn(
      `CATEGORIES disagrees with the React metadata's taxonomy: ` +
        `${missing.length > 0 ? `missing ${missing.join(', ')}` : ''}` +
        `${missing.length > 0 && extra.length > 0 ? '; ' : ''}` +
        `${extra.length > 0 ? `extra ${extra.join(', ')}` : ''}.`,
    );
  }
}

/**
 * What `<pf-icon>` draws with nothing registered.
 *
 * It used to come from the React metadata, where `validate_usage` read it --
 * so a name was checked against the *React* registry whichever layer the
 * markup was for. That was harmless only because the two lists agree, and
 * `scripts/lib/icon-registry.mjs` is now the thing that makes them agree: it
 * asserts each layer's `name: faXxx` map against core's
 * `BUNDLED_FA_ICON_NAMES` and throws when they diverge.
 */
const icons = readIconRegistry({
  bundledFile: 'packages/elements/src/components/pf-icon/bundled-icons.ts',
  declaration: 'const bundled = {',
});

/**
 * The house rules an agent writing element markup needs, which travel in the
 * artifact because CLAUDE.md is in no npm package.
 *
 * They used to come only from the React metadata, so an agent writing
 * `<pf-input>` was handed rules about `forwardRef` and the `pf-field` wrapper
 * — every one of them about a layer it was not using.
 *
 * `WebComponents.mdx` leads because it is the consumer-facing prose: how to
 * install, the custom-property-versus-`::part()` split, and where the element
 * API deliberately differs from the React one. CLAUDE.md's own
 * `Web components` section is deliberately **not** here — 74 KB written for
 * someone editing this repository, none of it actionable for a consumer.
 */
const conventions = [
  readMdxConventions('apps/docs/src/WebComponents.mdx', warn),
  readConventions(ELEMENT_CONVENTION_SECTIONS, warn),
]
  .filter(Boolean)
  .join('\n\n');

const output = {
  $schema: 'https://lelandrangel.com/pitchfork-ui/schema/elements.json',
  name: elementsPkg.name,
  version: elementsPkg.version,
  generatedBy: 'scripts/build-elements-metadata.mjs',
  categories: CATEGORIES,
  conventions,
  icons,
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
if (reactMetadata) {
  console.log(
    `  react coverage: ${Object.keys(reactCoverage).length}/${reactMetadata.components.length} ` +
      `components, ${Object.values(reactCoverage).filter((e) => e.absorbed).length} absorbed`,
  );
} else {
  console.log('  no React metadata on disk, so no coverage map — the elements stand alone');
}

if (warnings.length > 0) {
  console.error(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) console.error(`  - ${warning}`);
  if (strict) {
    console.error('\n--strict: failing.');
    process.exit(1);
  }
}
