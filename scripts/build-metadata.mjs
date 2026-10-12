/**
 * Component metadata extractor.
 *
 * Derives a machine-readable description of the public component API from
 * source, for consumption by coding agents (llms.txt, MCP server, codegen).
 *
 * Sources, in order of authority:
 *   props        <- TS interfaces under packages/react/src/components
 *   defaults     <- destructuring defaults in the component render function
 *   cssVars      <- component .css files, resolved through tokens/src/theme.css
 *   icons        <- scripts/lib/icon-registry.mjs, from core and Icon.tsx
 *   conventions  <- scripts/lib/conventions.mjs, from CLAUDE.md
 *
 * Output: packages/react/dist/metadata.json
 *
 * **This describes the deprecated layer.** `build-elements-metadata.mjs` is
 * the one that matters; this one lives on for as long as
 * `@pitchfork-ui/react` is published, so the MCP server can still answer
 * `get_component` for someone maintaining code against it.
 *
 * It used to read examples from `apps/docs/src/*.examples.stories.tsx` and
 * descriptions from `apps/docs/src/*.mdx`, 246 lines between them. Both paths
 * are gone: those 150 files were deleted when the elements took over the
 * `Components` section of the docs site, so the extractors ran over nothing
 * and reported `described: 0` and `examples: 0` on every build. Code that can
 * only ever produce nothing reads as something that might, which is worse
 * than an honest gap -- the elements carry the depth now, in `elements.json`.
 *
 * Nothing here is hand-maintained; if a component gains a prop or a variant,
 * rerunning this picks it up. If it doesn't, the extractor has a gap — fix the
 * extractor, not the output.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readIconRegistry } from './lib/icon-registry.mjs';
import { REACT_CONVENTION_SECTIONS, readConventions } from './lib/conventions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const componentsDir = join(root, 'packages/react/src/components');
const themeCssPath = join(root, 'packages/tokens/src/theme.css');
const outDir = join(root, 'packages/react/dist');
const outFile = join(outDir, 'metadata.json');

const warnings = [];
const warn = (message) => warnings.push(message);

const strict = process.argv.includes('--strict');

/* ------------------------------------------------------------------ *
 * Category taxonomy
 *
 * Mirrors the page grouping in FIGMA-KIT-PLAN.md §2 so the Figma kit,
 * the Storybook sidebar and this metadata all agree on where a component
 * belongs. Components absent from that plan (added since) are slotted in
 * by the same logic.
 * ------------------------------------------------------------------ */
const CATEGORIES = {
  forms: [
    'Input',
    'Textarea',
    'Select',
    'Combobox',
    'MultiSelect',
    'Checkbox',
    'RadioButton',
    'RadioGroup',
    'Switch',
    'Slider',
    'NumberInput',
    'DatePicker',
    'DateRangePicker',
    'FileUploader',
    'RichTextEditor',
    'Rating',
    'TagInput',
    'TimePicker',
  ],
  actions: ['Button', 'ButtonGroup', 'UtilityButton', 'InlineCTA', 'Kbd'],
  display: [
    'Badge',
    'BadgeGroup',
    'Tag',
    'Avatar',
    'AvatarGroup',
    'Card',
    'CreditCard',
    'Metrics',
    'EmptyState',
    'Tooltip',
    'Accordion',
    'ContentDivider',
    'CodeSnippet',
    'Collapsible',
    'Icon',
    'Timeline',
  ],
  navigation: [
    'Tabs',
    'Breadcrumbs',
    'Pagination',
    'SidebarNavigation',
    'HeaderNavigation',
    'ProgressSteps',
    'TreeView',
    'Toolbar',
  ],
  overlays: [
    'Modal',
    'SlideoutMenu',
    'Popover',
    'Dropdown',
    'CommandPalette',
    'Toast',
    'Notification',
    'Calendar',
    'ContextMenu',
  ],
  feedback: ['Alert', 'LoadingIndicators', 'ProgressIndicators', 'GaugeChart'],
  dataviz: [
    'LineChart',
    'BarChart',
    'AreaChart',
    'PieChart',
    'RadarChart',
    'Heatmap',
    'Sparkline',
    'Table',
    'LineBarChart',
  ],
  media: ['VideoPlayer', 'Carousel'],
  layout: ['PageHeader', 'SectionHeader', 'SectionFooter', 'Resizable', 'ScrollArea'],
  utility: ['VisuallyHidden'],
};

const categoryOf = (name, folder) => {
  for (const [category, members] of Object.entries(CATEGORIES)) {
    if (members.includes(name)) return category;
  }
  // A sub-component (LoadingSpinner, ProgressBar, MetricCard) inherits the
  // category of the folder that exports it.
  for (const [category, members] of Object.entries(CATEGORIES)) {
    if (members.includes(folder)) return category;
  }
  warn(`uncategorized component: ${name} — add it to CATEGORIES in build-metadata.mjs`);
  return 'uncategorized';
};

/* ------------------------------------------------------------------ *
 * theme.css alias resolution
 *
 * The three-tier chain (component var -> theme alias -> token) is the part
 * a generic docgen dump cannot produce, and the reason an agent using this
 * metadata writes var(--pf-*) instead of a hardcoded hex value.
 * ------------------------------------------------------------------ */
function parseThemeAliases() {
  const css = readFileSync(themeCssPath, 'utf8');
  const darkIndex = css.search(/\[data-theme=['"]dark['"]\]/);
  const lightSource = darkIndex === -1 ? css : css.slice(0, darkIndex);
  const darkSource = darkIndex === -1 ? '' : css.slice(darkIndex);

  const collect = (source) => {
    const map = new Map();
    const declaration = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = declaration.exec(source)) !== null) {
      map.set(match[1], match[2].trim().replace(/\s+/g, ' '));
    }
    return map;
  };

  return { light: collect(lightSource), dark: collect(darkSource) };
}

/** Pull the first var() reference out of a declaration value. */
const firstVarRef = (value) => value?.match(/var\(\s*(--[\w-]+)/)?.[1] ?? null;

/**
 * Walk a component-level variable down to the token it ultimately resolves to,
 * recording each hop. Cycles and missing links terminate the walk rather than
 * throwing — a broken chain is data worth reporting, not a build failure.
 */
function resolveChain(varName, aliasMap) {
  const chain = [varName];
  const seen = new Set([varName]);
  let current = varName;

  while (true) {
    const value = aliasMap.get(current);
    if (!value) break;
    const next = firstVarRef(value);
    if (!next || seen.has(next)) {
      if (!next) chain.push(value); // literal terminal value
      break;
    }
    chain.push(next);
    seen.add(next);
    current = next;
  }

  return chain;
}

/* ------------------------------------------------------------------ *
 * Component CSS -> variables consumed
 *
 * A component references a variable in one of several ways, and the
 * difference matters to a consumer theming the library:
 *   token      a design token used directly (--space-3, --radius-md)
 *   alias      the documented three-tier chain, defined in theme.css
 *   override   no theme.css alias, but an inline fallback supplies the
 *              default — a deliberate consumer override hook
 *   runtime    computed by the component and set via an inline style prop
 * ------------------------------------------------------------------ */

/**
 * Scan a stylesheet for var() references, capturing any inline fallback.
 * Hand-rolled rather than regex because fallbacks nest:
 * `var(--pf-card-radius, var(--radius-lg))`.
 */
function parseVarRefs(css) {
  const refs = [];
  const token = 'var(';
  let index = css.indexOf(token);

  while (index !== -1) {
    const bodyStart = index + token.length;
    let depth = 1;
    let cursor = bodyStart;
    let splitAt = -1;

    while (cursor < css.length && depth > 0) {
      const char = css[cursor];
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (char === ',' && depth === 1 && splitAt === -1) splitAt = cursor;
      cursor += 1;
    }

    const name = css.slice(bodyStart, splitAt === -1 ? cursor - 1 : splitAt).trim();
    if (name.startsWith('--')) {
      refs.push({
        name,
        fallback:
          splitAt === -1
            ? null
            : css
                .slice(splitAt + 1, cursor - 1)
                .trim()
                .replace(/\s+/g, ' '),
      });
    }

    index = css.indexOf(token, bodyStart);
  }

  return refs;
}

function extractCssVars(cssPath, theme, tsxSource = '') {
  if (!existsSync(cssPath)) return [];

  const css = readFileSync(cssPath, 'utf8');
  let match;

  // Variables the stylesheet defines itself are locals, not part of the
  // component's theming contract.
  const locallyDefined = new Set();
  const declaration = /(--[\w-]+)\s*:/g;
  while ((match = declaration.exec(css)) !== null) locallyDefined.add(match[1]);

  // Variables the component computes and sets through an inline style prop
  // (gauge circumference, progress dash offset, heatmap cell size).
  const runtimeDefined = new Set();
  const inlineStyle = /['"](--[\w-]+)['"]\s*:/g;
  while ((match = inlineStyle.exec(tsxSource)) !== null) runtimeDefined.add(match[1]);

  const byName = new Map();
  for (const ref of parseVarRefs(css)) {
    if (locallyDefined.has(ref.name)) continue;
    const existing = byName.get(ref.name);
    if (!existing || (!existing.fallback && ref.fallback)) byName.set(ref.name, ref);
  }

  return [...byName.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, fallback }) => {
      const entry = { name };

      if (!name.startsWith('--pf-')) {
        entry.kind = 'token';
      } else if (theme.light.has(name)) {
        entry.kind = 'alias';
      } else if (runtimeDefined.has(name)) {
        entry.kind = 'runtime';
      } else if (fallback) {
        entry.kind = 'override';
      } else {
        entry.kind = 'unresolved';
        warn(
          `${name} is referenced but has no theme.css alias, inline fallback, or runtime assignment`,
        );
      }

      const chain = resolveChain(name, theme.light);
      if (chain.length > 1) entry.chain = chain;
      if (fallback) entry.fallback = fallback;
      if (theme.dark.has(name)) entry.darkOverride = resolveChain(name, theme.dark);

      return entry;
    });
}

/* ------------------------------------------------------------------ *
 * Props via the TypeScript compiler API
 * ------------------------------------------------------------------ */
function jsDocOf(node) {
  const parts = ts
    .getJSDocCommentsAndTags(node)
    .map((tag) => (typeof tag.comment === 'string' ? tag.comment : ''))
    .filter(Boolean);
  return parts.length ? parts.join(' ').replace(/\s+/g, ' ').trim() : undefined;
}

/**
 * Collect `prop = default` pairs out of a component's destructured first
 * parameter. The type checker doesn't surface these; they live in the
 * implementation signature.
 */
function collectDefaults(node, sourceFile) {
  const defaults = {};
  const fromParams = (fn) => {
    const [first] = fn.parameters ?? [];
    if (!first || !ts.isObjectBindingPattern(first.name)) return;
    for (const element of first.name.elements) {
      if (element.initializer) {
        defaults[element.name.getText(sourceFile)] = element.initializer.getText(sourceFile);
      }
    }
  };

  const visit = (n) => {
    if (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n)) {
      fromParams(n);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return defaults;
}

/** Expand a string-literal union to its members; otherwise keep the written type. */
function readableType(member, checker, sourceFile) {
  const written = member.type?.getText(sourceFile) ?? 'unknown';
  const symbol = checker.getSymbolAtLocation(member.name);
  if (!symbol) return written;

  const type = checker.getTypeOfSymbolAtLocation(symbol, member);
  const constituents = type.isUnion()
    ? type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined))
    : [type];

  if (constituents.length > 1 && constituents.every((t) => t.isStringLiteral())) {
    return constituents.map((t) => `'${t.value}'`).join(' | ');
  }
  return written;
}

/**
 * Find the props type a component declares — `forwardRef<Ref, XProps>(...)` or
 * an annotated first parameter. Falls back to the caller's naming convention.
 */
function propsTypeNameOf(node, sourceFile) {
  let found;

  const visit = (n) => {
    if (found) return;
    if (
      ts.isCallExpression(n) &&
      n.expression.getText(sourceFile) === 'forwardRef' &&
      n.typeArguments?.length === 2
    ) {
      found = n.typeArguments[1].getText(sourceFile);
      return;
    }
    if (ts.isFunctionDeclaration(n) && n.parameters[0]?.type) {
      found = n.parameters[0].type.getText(sourceFile);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);

  return found;
}

/** Heritage clauses wrap across lines in source; collapse them to one line. */
const normaliseType = (text) => text.replace(/\s+/g, ' ').trim();

/** A React DOM attributes type — props are then "whatever HTML allows". */
const isDomAttributes = (type) =>
  /React\.(?:\w*HTMLAttributes|AriaAttributes|DOMAttributes|SVGAttributes|SVGProps)\b/.test(type);

/**
 * How an `Omit<X, 'a'>` or `Pick<X, 'a'>` wrapper narrows what it brings in.
 * Without the `Pick` arm a picked type would contribute every member of its
 * source, which is worse than missing it: the metadata would claim props the
 * component does not accept.
 */
function memberFilter(type) {
  const keysIn = (source) => new Set([...source.matchAll(/'([^']+)'/g)].map((m) => m[1]));

  const omit = type.match(/^Omit<.*?,\s*(.*)>$/);
  if (omit) {
    const dropped = keysIn(omit[1]);
    return (name) => !dropped.has(name);
  }

  const pick = type.match(/^Pick<.*?,\s*(.*)>$/);
  if (pick) {
    const kept = keysIn(pick[1]);
    return (name) => kept.has(name);
  }

  return () => true;
}

/**
 * Normalise an interface or type alias into its own members plus the types it
 * builds on. What it extends is recorded rather than inlined: flattening
 * React.HTMLAttributes would add ~250 inherited props per component and bury
 * the handful that are actually specific to it.
 */
function readPropsDeclaration(declaration, sourceFile) {
  if (ts.isInterfaceDeclaration(declaration)) {
    return {
      members: [...declaration.members],
      extendsTypes: (declaration.heritageClauses ?? []).flatMap((clause) =>
        clause.types.map((t) => normaliseType(t.getText(sourceFile))),
      ),
    };
  }

  const members = [];
  const extendsTypes = [];
  const walk = (typeNode) => {
    if (ts.isTypeLiteralNode(typeNode)) {
      members.push(...typeNode.members);
    } else if (ts.isIntersectionTypeNode(typeNode)) {
      typeNode.types.forEach(walk);
    } else {
      extendsTypes.push(normaliseType(typeNode.getText(sourceFile)));
    }
  };
  walk(declaration.type);

  return { members, extendsTypes };
}

/**
 * Expand an extends clause that names another props type from the same file.
 * AreaChart's props are `Omit<LineChartProps, 'area'>`; without this it reports
 * no props at all, which is worse than useless — and makes any consumer that
 * checks props against the list reject perfectly valid code.
 */
function expandInherited(extendsTypes, declarations, sourceFile, seen = new Set()) {
  const inherited = [];
  const unresolved = [];

  for (const type of extendsTypes) {
    const referenced = type.match(/\b([A-Z]\w*Props)\b/)?.[1];
    const declaration = referenced && !seen.has(referenced) ? declarations.get(referenced) : null;

    if (!declaration) {
      unresolved.push(type);
      continue;
    }

    seen.add(referenced);
    const keep = memberFilter(type);
    const { members, extendsTypes: nested } = readPropsDeclaration(declaration, sourceFile);

    for (const member of members) {
      if (!ts.isPropertySignature(member)) continue;
      if (!keep(member.name.getText(sourceFile))) continue;
      inherited.push({ member, from: referenced });
    }

    const deeper = expandInherited(nested, declarations, sourceFile, seen);
    inherited.push(...deeper.inherited);
    unresolved.push(...deeper.unresolved);
  }

  return { inherited, unresolved };
}

function extractComponents(theme) {
  const entries = [];
  const folders = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);

  const files = [];
  for (const folder of folders) {
    for (const file of readdirSync(join(componentsDir, folder))) {
      if (file.endsWith('.tsx') && !file.endsWith('.test.tsx')) {
        files.push(join(componentsDir, folder, file));
      }
    }
  }

  const program = ts.createProgram(files, {
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();

  for (const file of files) {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) continue;

    const folder = file.slice(componentsDir.length + 1).split('/')[0];
    // The defining file is not always named after the folder or the component:
    // LineChart and BarChart both live in LineBarCharts/LineBarChart.tsx.
    const definedIn = file.slice(file.lastIndexOf('/') + 1).replace(/\.tsx$/, '');
    const cssPath = file.replace(/\.tsx$/, '.css');
    const cssVars = extractCssVars(cssPath, theme, sourceFile.text);

    const interfaces = new Map();
    const components = new Map();

    ts.forEachChild(sourceFile, (node) => {
      const exported = ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export;

      // Props are declared as an interface in most components and as a type
      // alias in a few (Card). Collect both under their declared name.
      if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith('Props')) {
        interfaces.set(node.name.text, node);
        return;
      }
      if (ts.isTypeAliasDeclaration(node) && node.name.text.endsWith('Props')) {
        interfaces.set(node.name.text, node);
        return;
      }
      if (!exported) return;

      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && /^[A-Z]/.test(decl.name.text)) {
            components.set(decl.name.text, decl);
          }
        }
      } else if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
        components.set(node.name.text, node);
      }
    });

    for (const [name, node] of components) {
      // Prefer the props type the component actually declares — CardHeader's is
      // CardSectionProps, which name-matching on `${name}Props` would miss.
      const declaredName = propsTypeNameOf(node, sourceFile) ?? `${name}Props`;
      const propsDeclaration = interfaces.get(declaredName) ?? interfaces.get(`${name}Props`);
      if (!propsDeclaration) continue; // not a component, or props declared elsewhere

      const { members, extendsTypes } = readPropsDeclaration(propsDeclaration, sourceFile);
      const defaults = collectDefaults(node, sourceFile);
      // Props inherited from another props type in the same file are this
      // component's props too; only unresolvable clauses stay in `extends`.
      const { inherited, unresolved } = expandInherited(extendsTypes, interfaces, sourceFile);

      const describe = (member, from) => {
        const propName = member.name.getText(sourceFile);
        const entry = {
          name: propName,
          type: readableType(member, checker, sourceFile),
          required: !member.questionToken,
        };
        if (defaults[propName] !== undefined) entry.default = defaults[propName];
        const description = jsDocOf(member);
        if (description) entry.description = description;
        if (from) entry.inheritedFrom = from;
        return entry;
      };

      const own = members.filter(ts.isPropertySignature).map((member) => describe(member, null));
      const ownNames = new Set(own.map((prop) => prop.name));
      const props = [
        ...own,
        ...inherited
          .filter(({ member }) => !ownNames.has(member.name.getText(sourceFile)))
          .map(({ member, from }) => describe(member, from)),
      ];

      entries.push({
        name,
        folder,
        sourceFile: definedIn,
        category: categoryOf(name, folder),
        importPath: '@pitchfork-ui/react',
        propsInterface: declaredName,
        extends: unresolved,
        // False when a props type extends something we cannot enumerate, so the
        // prop list is known to be partial. A consumer must not then treat an
        // unlisted prop as invalid.
        propsComplete: unresolved.every(isDomAttributes),
        forwardsRef:
          sourceFile.text.includes(`forwardRef`) && node.getText(sourceFile).includes('forwardRef'),
        props,
        cssVars,
      });
    }
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
function main() {
  const version = JSON.parse(
    readFileSync(join(root, 'packages/react/package.json'), 'utf8'),
  ).version;

  const theme = parseThemeAliases();
  const components = extractComponents(theme);

  /**
   * Everything `Icon` will actually resolve, in the shapes it resolves them.
   *
   * `IconName` widens to `string`, because `registerIcons()` can add names at
   * runtime, so nothing in the type tells a consumer -- or the MCP server's
   * `validate_usage` -- which names resolve out of the box. Without this list
   * an unregistered name like `paper-plane` looks perfectly valid and silently
   * renders nothing.
   *
   * Canonical names alone are not enough to check against: `Icon` also accepts
   * a Font Awesome alias (`bar-chart` for `chart-bar`) and a camelCase
   * spelling (`chartBar`). A validator holding only the canonical list rejects
   * both, which is worse than not checking at all.
   *
   * The reading moved to `scripts/lib/icon-registry.mjs` when
   * `build-elements-metadata.mjs` needed the same answer: three of its four
   * inputs are in core and survive `packages/react`, and the fourth is the
   * `name: faXxx` map, which each layer writes out itself so a consumer's
   * bundle carries only the icons in use. Only that file's path differs
   * between the two callers.
   */
  const readIconNames = () =>
    readIconRegistry({
      bundledFile: 'packages/react/src/components/Icon/Icon.tsx',
      declaration: 'const bundledRegularIcons = {',
    });

  const metadata = {
    $schema: 'https://lelandrangel.com/pitchfork-ui/metadata.schema.json',
    name: '@pitchfork-ui/react',
    version,
    generatedBy: 'scripts/build-metadata.mjs',
    categories: Object.keys(CATEGORIES),
    conventions: readConventions(REACT_CONVENTION_SECTIONS, warn),
    icons: readIconNames(),
    components,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(`metadata.json written to packages/react/dist/`);
  console.log(`  components:  ${components.length}`);
  console.log(
    `  css vars:    ${new Set(components.flatMap((c) => c.cssVars.map((v) => v.name))).size} distinct`,
  );

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const message of warnings.slice(0, 20)) console.log(`  - ${message}`);
    if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`);
  }

  // The generated artifact is not committed (dist/ is gitignored), so there is
  // no stale copy to diff against. What is worth gating on is the extractor
  // still understanding the codebase: a new component nobody categorised, a
  // variable that resolves to nothing, a story whose usage cannot be read.
  if (strict) {
    if (warnings.length) {
      console.error(`\n--strict: ${warnings.length} warning(s); failing.`);
      process.exit(1);
    }
    console.log('\n--strict: clean.');
  }
}

main();
