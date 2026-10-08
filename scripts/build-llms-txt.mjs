/**
 * llms.txt generator.
 *
 * Projects the Phase 1 metadata artifact into the two files an agent can read
 * without installing anything:
 *
 *   llms.txt       an index — what exists, one line each, linked to its docs page
 *   llms-full.txt  the whole library in one fetch — props, theming, examples
 *
 * Both are derived from packages/react/dist/metadata.json and CLAUDE.md, so
 * neither can drift from the library. Run build:metadata first.
 *
 * Output: apps/docs/public/, which Storybook copies to the site root, so the
 * files land at <homepage>llms.txt and <homepage>llms-full.txt.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const metadataPath = join(root, 'packages/react/dist/metadata.json');
const docsSrc = join(root, 'apps/docs/src');
const outDir = join(root, 'apps/docs/public');

if (!existsSync(metadataPath)) {
  console.error(
    'packages/react/dist/metadata.json not found — run `npm run build:metadata` first.',
  );
  process.exit(1);
}

const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
const reactPkg = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'));

/*
 * The elements are the other half of the library, and an agent reading these
 * files has no other way to learn they exist. Their metadata comes from
 * Stencil's docs.json via build:elements-metadata; absent, these files are
 * still written, because the React half is independently useful and the
 * elements build is slower -- but --strict refuses, since a published llms.txt
 * missing half the library is worse than a failed build.
 */
const elementsPath = join(root, 'packages/elements/dist/elements.json');
const elementMetadata = existsSync(elementsPath)
  ? JSON.parse(readFileSync(elementsPath, 'utf8'))
  : null;
const site = reactPkg.homepage.endsWith('/') ? reactPkg.homepage : `${reactPkg.homepage}/`;

/* ------------------------------------------------------------------ *
 * Documentation links
 *
 * Storybook derives a page id by lowercasing the story title and collapsing
 * every run of non-alphanumeric characters to a dash, so `Components/Line &
 * Bar Charts` becomes `components-line-bar-charts`. The titles are the only
 * source for this — a component's own name does not survive the transform
 * (`AreaChart` is published under `Area Chart`).
 * ------------------------------------------------------------------ */
const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function readStoryTitles() {
  const byFile = new Map();
  for (const file of readdirSync(docsSrc)) {
    if (!file.endsWith('.stories.tsx') || file.includes('.examples.')) continue;

    // Anchor on the meta declaration. Sample data in these files carries its own
    // `title:` fields — Accordion's fixtures open with "How long does shipping
    // take?" — so the first match in the file is not necessarily the story's.
    const source = readFileSync(join(docsSrc, file), 'utf8');
    const metaAt = source.search(/const meta\b/);
    const title = source.slice(metaAt === -1 ? 0 : metaAt).match(/title:\s*'([^']+)'/)?.[1];
    if (title) byFile.set(file.replace('.stories.tsx', ''), title);
  }
  return byFile;
}

const storyTitles = readStoryTitles();

/**
 * A component's docs page. Most have one of their own; a sub-component falls
 * back to the page for the file or folder it is defined in — LineChart and
 * BarChart are both documented on the `Line & Bar Charts` page.
 */
function docsUrlFor(component) {
  const title =
    storyTitles.get(component.name) ??
    storyTitles.get(component.sourceFile) ??
    storyTitles.get(component.folder);
  return title ? `${site}?path=/docs/${slugify(title)}--docs` : null;
}

/**
 * A generated element page. `scripts/build-elements-docs.mjs` titles every one
 * `Web components/<PfName>`, so unlike the components these need no lookup --
 * but they go through the same slugify, and `--verify` checks them against the
 * ids Storybook actually built, which is what would catch the convention
 * changing.
 */
const elementDocsUrl = (element) =>
  `${site}?path=/docs/${slugify(`Web components/${element.name}`)}--docs`;

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */

/** Pipes inside a type (`'a' | 'b'`) would otherwise split the table cell. */
const cell = (value) => String(value).replace(/\|/g, '\\|');

/**
 * Collapse the hard wrapping before looking for the sentence end. `.` does not
 * match a newline, so on a wrapped doc comment the match fails and the fallback
 * returns the *entire* description — which put four paragraphs of
 * `pf-accordion`'s prose into a one-line index bullet. The React descriptions
 * come from MDX and are single-line, so this changes nothing for them.
 */
const firstSentence = (text) => {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  const match = flat.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : flat).trim();
};

function propsTable(props) {
  if (!props.length) return '_No component-specific props._';
  const rows = props.map(
    (p) =>
      `| \`${p.name}\` | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : '—'} | ${p.required ? 'yes' : 'no'} |`,
  );
  return ['| Prop | Type | Default | Required |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

/**
 * Only the `alias` variables are part of a component's theming contract: those
 * are the documented `component var -> theme alias -> token` chain. Tokens used
 * directly, runtime-computed values and override hooks are noise here.
 */
function themeVars(cssVars) {
  const aliases = cssVars.filter((v) => v.kind === 'alias');
  if (!aliases.length) return null;
  return aliases
    .map((v) => {
      // Point at the last *variable* in the chain, not its final value. A
      // composite alias like --pf-focus-ring bottoms out in a literal ("3px")
      // that says nothing useful about what the variable controls.
      const target = v.chain
        ?.slice(1)
        .filter((step) => step.startsWith('--'))
        .pop();
      return target ? `- \`${v.name}\` → \`${target}\`` : `- \`${v.name}\``;
    })
    .join('\n');
}

/* ------------------------------------------------------------------ *
 * llms.txt — the index
 * ------------------------------------------------------------------ */
function buildIndex() {
  const out = [];
  out.push('# Pitchfork UI');
  out.push('');
  out.push(`> ${reactPkg.description}`);
  out.push('');
  out.push(
    `Version ${metadata.version}. Install \`${metadata.name}\`, import components from ` +
      `\`${metadata.name}\` and the stylesheet from \`${metadata.name}/styles.css\`. ` +
      `Every component is typed, forwards its ref where it wraps a real element, and spreads ` +
      `unknown props onto that element.`,
  );
  out.push('');
  out.push(
    `The complete API is published as JSON at \`${metadata.name}/metadata\` — props, ` +
      `variants, theme variables and worked examples for all ${metadata.components.length} ` +
      `exported components. Prefer it over scraping these files.`,
  );
  out.push('');
  out.push('## Conventions');
  out.push('');
  out.push('- Never hardcode a colour, radius or spacing value. Use the CSS variables.');
  out.push('- Class names are BEM-like under a `pf-` prefix: `.pf-button--primary`.');
  out.push('- Dark mode is handled by `[data-theme="dark"]`; components need no dark styles.');
  out.push('- Styles are mobile-first; wider layouts are added in `@media` blocks.');
  out.push('- Prefer semantic HTML — a `<button>`, not a `<div role="button">`.');
  out.push('');

  for (const category of metadata.categories) {
    const members = metadata.components.filter((c) => c.category === category);
    if (!members.length) continue;

    out.push(`## ${category[0].toUpperCase()}${category.slice(1)}`);
    out.push('');
    for (const component of members) {
      const url = docsUrlFor(component);
      const summary =
        firstSentence(component.description) || `Part of ${component.folder}, exported separately.`;
      out.push(
        url ? `- [${component.name}](${url}): ${summary}` : `- ${component.name}: ${summary}`,
      );
    }
    out.push('');
  }

  if (elementMetadata) {
    out.push('## Web components');
    out.push('');
    out.push(
      `The same library as standard custom elements in \`${elementMetadata.name}\` — ` +
        'a first-class layer, not wrappers around the React components. Use them in ' +
        'Angular, Vue, plain HTML, or anywhere the React components do not fit. ' +
        `Typed bindings are generated for each framework: \`${elementMetadata.bindings.react}\`, ` +
        `\`${elementMetadata.bindings.angular}\`, \`${elementMetadata.bindings.vue}\`. ` +
        `The complete element API is JSON at \`${elementMetadata.name}/metadata\`.`,
    );
    out.push('');
    out.push(
      'Two things that differ from the React props and have no React equivalent: ' +
        'a prop typed as an array or a function has **no attribute**, so markup ' +
        'cannot set it (assign the property, or pass it through a binding); and ' +
        'a consumer stylesheet cannot reach inside a shadow root, so styling goes ' +
        'through the `::part()` names each element documents, or through the ' +
        '`--pf-*` custom properties, which do cross the boundary.',
    );
    out.push('');
    for (const element of elementMetadata.elements) {
      const notes = [
        element.childOf ? `goes inside \`<${element.childOf}>\`` : null,
        element.formAssociated ? 'form control' : null,
        element.reactCounterpart ? `React: \`${element.reactCounterpart}\`` : null,
      ].filter(Boolean);
      out.push(
        `- [<${element.tag}>](${elementDocsUrl(element)}): ` +
          `${firstSentence(element.description) || `The \`${element.tag}\` element.`}` +
          (notes.length ? ` (${notes.join('; ')})` : ''),
      );
    }
    out.push('');
  }

  out.push('## Optional');
  out.push('');
  out.push(
    `- [Full reference](${site}llms-full.txt): every component's props, theme variables and examples in one file.`,
  );
  out.push(`- [Storybook](${site}): live examples, controls and accessibility checks.`);
  out.push(`- [Source](${reactPkg.repository.url.replace(/^git\+|\.git$/g, '')}): the repository.`);
  out.push('');

  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * llms-full.txt — everything in one fetch
 * ------------------------------------------------------------------ */
function buildFull() {
  const out = [];
  out.push('# Pitchfork UI — full reference');
  out.push('');
  out.push(`> ${reactPkg.description}`);
  out.push('');
  out.push(
    `Generated from ${metadata.name}@${metadata.version}. ` +
      `${metadata.components.length} exported components. ` +
      `The same data is available as JSON at \`${metadata.name}/metadata\`.`,
  );
  out.push('');
  out.push('```bash');
  out.push(`npm install ${metadata.name}`);
  out.push('```');
  out.push('');
  out.push('```tsx');
  out.push(`import { Button } from '${metadata.name}';`);
  out.push(`import '${metadata.name}/styles.css';`);
  out.push('```');
  out.push('');
  out.push(metadata.conventions);
  out.push('');
  out.push('---');
  out.push('');
  out.push('## Components');
  out.push('');

  for (const component of metadata.components) {
    const url = docsUrlFor(component);
    out.push(`### ${component.name}`);
    out.push('');
    out.push(
      `Category: ${component.category} · Import: \`import { ${component.name} } from '${metadata.name}'\`` +
        (url ? ` · [Docs](${url})` : ''),
    );
    out.push('');

    if (component.description) {
      out.push(component.description);
      out.push('');
    }
    if (component.extends?.length) {
      out.push(`Also accepts every prop of \`${component.extends.join('`, `')}\`.`);
      out.push('');
    }

    out.push(propsTable(component.props));
    out.push('');

    if (component.a11y?.length) {
      out.push('**Accessibility**');
      out.push('');
      for (const note of component.a11y) out.push(`- ${note}`);
      out.push('');
    }

    const vars = themeVars(component.cssVars);
    if (vars) {
      out.push('**Theme variables**');
      out.push('');
      out.push(vars);
      out.push('');
    }

    if (component.examples?.length) {
      out.push('**Examples**');
      out.push('');
      for (const example of component.examples) {
        out.push(`_${example.name}_`);
        out.push('');
        out.push('```tsx');
        out.push(example.code);
        out.push('```');
        out.push('');
      }
    }
  }

  if (elementMetadata) {
    out.push('---');
    out.push('');
    out.push('## Web components');
    out.push('');
    out.push(
      `${elementMetadata.elements.length} custom elements in ` +
        `\`${elementMetadata.name}@${elementMetadata.version}\`, with generated bindings for ` +
        `React, Angular and Vue. The same data is JSON at ` +
        `\`${elementMetadata.name}/metadata\`.`,
    );
    out.push('');
    out.push('```bash');
    out.push(`npm install ${elementMetadata.name}`);
    out.push('```');
    out.push('');
    out.push('```html');
    out.push('<script type="module">');
    out.push(`  import { defineCustomElements } from '${elementMetadata.name}/loader';`);
    out.push('  defineCustomElements();');
    out.push('</script>');
    out.push('');
    out.push('<pf-button variant="primary">Save</pf-button>');
    out.push('```');
    out.push('');

    for (const element of elementMetadata.elements) {
      out.push(`### <${element.tag}>`);
      out.push('');
      out.push(
        `Category: ${element.category ?? 'uncategorised'} · ` +
          `Binding: \`${element.name}\` · [Docs](${elementDocsUrl(element)})` +
          (element.reactCounterpart ? ` · React: \`${element.reactCounterpart}\`` : '') +
          (element.childOf ? ` · goes inside \`<${element.childOf}>\`` : ''),
      );
      out.push('');
      if (element.formAssociated) {
        out.push('Form-associated: submits with a surrounding `<form>` under its `name`.');
        out.push('');
      }
      if (element.description) {
        out.push(element.description);
        out.push('');
      }

      if (element.props.length) {
        out.push('| Prop | Attribute | Type | Default |');
        out.push('| --- | --- | --- | --- |');
        for (const prop of element.props) {
          out.push(
            `| \`${prop.name}\` | ${prop.attr ? `\`${prop.attr}\`` : '_property only_'} | ` +
              `\`${cell(prop.type)}\` | ${prop.default ? `\`${cell(prop.default)}\`` : '—'} |`,
          );
        }
        out.push('');
      }

      if (element.events.length) {
        out.push('**Events** (`onPfX` in the React bindings)');
        out.push('');
        for (const event of element.events) {
          out.push(
            `- \`${event.name}\`${event.detail ? ` — \`${cell(event.detail)}\`` : ''}` +
              `${event.description ? `: ${firstSentence(event.description)}` : ''}`,
          );
        }
        out.push('');
      }

      if (element.methods.length) {
        out.push('**Methods** (all async)');
        out.push('');
        for (const method of element.methods) out.push(`- \`${method.signature}\``);
        out.push('');
      }

      if (element.slots.length) {
        out.push('**Slots**');
        out.push('');
        for (const slot of element.slots) {
          out.push(`- ${slot.name ? `\`${slot.name}\`` : '_default_'}: ${slot.description}`);
        }
        out.push('');
      }

      if (element.parts.length) {
        out.push(`**Parts** — \`${element.tag}::part(name)\``);
        out.push('');
        for (const part of element.parts) out.push(`- \`${part.name}\`: ${part.description}`);
        out.push('');
      }
    }
  }

  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */
mkdirSync(outDir, { recursive: true });

const index = buildIndex();
const full = buildFull();

writeFileSync(join(outDir, 'llms.txt'), `${index.trimEnd()}\n`);
writeFileSync(join(outDir, 'llms-full.txt'), `${full.trimEnd()}\n`);

const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(0);
const linked = metadata.components.filter((c) => docsUrlFor(c)).length;

/**
 * Cross-check every generated link against the ids Storybook actually built.
 * The slug is derived from story titles, so a title read from the wrong place
 * produces a plausible-looking link to a page that does not exist. Runs only
 * once a docs build exists to compare against.
 */
function verifyLinks(text) {
  const indexPath = join(root, 'apps/docs/storybook-static/index.json');
  if (!existsSync(indexPath)) {
    console.error(
      '\n--verify: apps/docs/storybook-static/index.json not found — build the docs first.',
    );
    process.exit(1);
  }

  const built = new Set(
    Object.values(JSON.parse(readFileSync(indexPath, 'utf8')).entries).map((e) => e.id),
  );
  const ids = [
    ...new Set([...text.matchAll(/\?path=\/docs\/([a-z0-9-]+--docs)/g)].map((m) => m[1])),
  ];
  const broken = ids.filter((id) => !built.has(id));

  if (broken.length) {
    console.error(`\n--verify: ${broken.length} link(s) point at pages that do not exist:`);
    for (const id of broken) console.error(`  - ${id}`);
    process.exit(1);
  }
  console.log(`\n--verify: all ${ids.length} docs links resolve.`);
}

console.log('llms.txt written to apps/docs/public/');
console.log(`  llms.txt:       ${kb(index)} KB`);
console.log(`  llms-full.txt:  ${kb(full)} KB`);
console.log(`  components:     ${metadata.components.length} (${linked} linked to a docs page)`);

if (elementMetadata) {
  console.log(`  elements:       ${elementMetadata.elements.length}`);
}

const unlinked = metadata.components.filter((c) => !docsUrlFor(c)).map((c) => c.name);
if (unlinked.length) console.log(`  no docs page:   ${unlinked.join(', ')}`);

if (process.argv.includes('--strict') && unlinked.length) {
  console.error(`\n--strict: ${unlinked.length} component(s) have no docs page.`);
  process.exit(1);
}

if (process.argv.includes('--strict') && !elementMetadata) {
  console.error(
    `\n--strict: ${elementsPath.slice(root.length + 1)} not found, so these files ` +
      'describe only the React half of the library. Run ' +
      '`npm run build:elements && npm run build:elements-metadata` first.',
  );
  process.exit(1);
}

if (process.argv.includes('--verify')) verifyLinks(index);
