/**
 * Rewrites `@pitchfork-ui/react` call sites to `@pitchfork-ui/elements-react`.
 *
 *   npm run codemod:elements -- apps/demo/src          # report, change nothing
 *   npm run codemod:elements -- --write apps/demo/src  # apply
 *
 * It does exactly three things, and refuses the rest:
 *
 *   1. the import specifier, `@pitchfork-ui/react` -> `@pitchfork-ui/elements-react`
 *   2. the component name, `Button` -> `PfButton`
 *   3. the event props, `onClick` -> `onPfClick`
 *
 * And it audits the call sites of every `Pf*` element in the files it scans,
 * ported or not, for a handler the element cannot fire. That audit exists
 * because the rename alone shipped a silent defect: `Switch.onChange` is
 * React's own synthetic handler, inherited from `InputHTMLAttributes` rather
 * than declared by the component, so it is in no metadata and the migration
 * map never sees it. Renaming `Switch` to `PfSwitch` leaves
 * `onChange={(e) => set(e.target.checked)}` in place, where it type-checks,
 * renders, and never fires -- `pf-switch` emits `pfChange` and no native
 * `change`. The theme-builder's dark-mode toggle was exactly that, and nothing
 * else in the repo would have reported it.
 *
 * **It refuses and annotates wherever the call site has to change shape.** A
 * wrong automatic rewrite of a content prop is worse than a `// TODO` pointing
 * at the right page: turning `heading={<b>x</b>}` into a slotted child means
 * deciding what element wraps it and where it goes, and a tool that guesses
 * produces markup that renders and is wrong. So a component that needs
 * reshaping is left exactly as it was, with a comment above it naming the props
 * and the guide.
 *
 * What it refuses is read from `scripts/lib/migration-map.mjs`, the same module
 * the guide is generated from -- so the tool and the page cannot disagree about
 * which components are drop-ins.
 *
 * Deliberately a regex pass rather than a TypeScript transform. The three
 * renames are lexical, the refusal cases are reported rather than rewritten,
 * and nothing is applied without `--write` -- so the cost of a parser (a
 * dependency, and a printer that reformats files it did not need to touch) buys
 * nothing here. The one thing that genuinely needs care is not rewriting inside
 * strings and comments, which `maskLiterals` handles.
 */

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { loadMigrationMap } from './lib/migration-map.mjs';

const REACT_PACKAGE = '@pitchfork-ui/react';
const ELEMENTS_PACKAGE = '@pitchfork-ui/elements-react';
const GUIDE = 'Foundations/Migrating in Storybook';
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);

const args = process.argv.slice(2);
const write = args.includes('--write');
const quiet = args.includes('--quiet');
const targets = args.filter((a) => !a.startsWith('--'));

if (targets.length === 0) {
  console.error('usage: codemod-react-to-elements.mjs [--write] <file-or-directory>...');
  process.exit(2);
}

const map = loadMigrationMap();
const byName = new Map(map.components.map((c) => [c.name, c]));
const byBinding = new Map(map.components.filter((c) => c.binding).map((c) => [c.binding, c]));

/**
 * Blank out comments, and optionally string literals, so a pattern never
 * matches inside them. Replaced with spaces rather than removed -- and
 * newlines kept -- so every index in the masked copy lines up with the real
 * source and a match found here can be spliced into that.
 *
 * `strings` is a parameter because the two passes need opposite things, and
 * conflating them was a real bug: the import scan looks *for* a string
 * literal (`'@pitchfork-ui/react'`), so masking strings made it unable to
 * match anything at all and every file reported "imports nothing". The rename
 * pass needs the opposite, or a `Button` in a comment gets rewritten.
 */
function mask(source, { strings }) {
  let out = '';
  let i = 0;
  const blank = (text) => text.replace(/[^\n]/g, ' ');
  while (i < source.length) {
    const rest = source.slice(i);
    const two = source.slice(i, i + 2);
    if (two === '//') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      out += blank(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (two === '/*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += blank(source.slice(i, stop));
      i = stop;
      continue;
    }
    const quote = source[i];
    if (strings && (quote === '"' || quote === "'" || quote === '`')) {
      const match = rest.match(
        quote === '`'
          ? /^`(?:\\.|[^`\\])*`?/
          : quote === '"'
            ? /^"(?:\\.|[^"\\\n])*"?/
            : /^'(?:\\.|[^'\\\n])*'?/,
      );
      const text = match ? match[0] : quote;
      out += blank(text);
      i += text.length;
      continue;
    }
    out += quote;
    i += 1;
  }
  return out;
}

/**
 * Apply `pattern` to `source` only where it matches in `masked` -- so an
 * identifier inside a string or a comment is left alone. Both must be the same
 * length, which `mask` guarantees.
 */
function replaceOutsideLiterals(source, masked, pattern, replacement) {
  let out = '';
  let last = 0;
  let hits = 0;
  const regex = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  );
  let match;
  while ((match = regex.exec(masked)) !== null) {
    out += source.slice(last, match.index) + replacement;
    last = match.index + match[0].length;
    hits += 1;
    if (match[0].length === 0) regex.lastIndex += 1;
  }
  out += source.slice(last);
  return { text: out, hits };
}

/** Which library components this file imports, and the import statement's span. */
function readImports(source, masked) {
  const results = [];
  const pattern = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${REACT_PACKAGE.replace('/', '\\/')}['"]\\s*;?`,
    'g',
  );
  // Matched against the *masked* copy so a mention inside a comment is not an
  // import, then sliced out of the real source by index.
  let match;
  while ((match = pattern.exec(masked)) !== null) {
    const names = source
      .slice(match.index, match.index + match[0].length)
      .replace(/^[\s\S]*?\{/, '')
      .replace(/\}[\s\S]*$/, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [imported, local] = part.split(/\s+as\s+/).map((p) => p.trim());
        return { imported, local: local ?? imported };
      });
    results.push({ start: match.index, end: match.index + match[0].length, names });
  }
  return results;
}

/**
 * React event props that a custom element host really does fire, because they
 * are DOM events that bubble out of the shadow root or are dispatched on the
 * host itself. Anything outside this set has to be one of the element's own
 * `pf*` events.
 *
 * `onChange` and `onInput` are deliberately **not** here. The form elements
 * emit `pfChange`/`pfInput` and no native equivalent, so a React `onChange`
 * left on one is the silent case this audit exists for -- which is also why
 * the set is a list of what works rather than a list of what does not: a new
 * React event prop is far more likely to be a DOM one than an element one, and
 * a false report is cheaper than a silent miss.
 */
const HOST_DOM_EVENTS = new Set([
  'onClick',
  'onDoubleClick',
  'onContextMenu',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOver',
  'onMouseOut',
  'onPointerDown',
  'onPointerUp',
  'onPointerMove',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerCancel',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
  'onFocus',
  'onBlur',
  'onFocusCapture',
  'onBlurCapture',
  'onWheel',
  'onScroll',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
  'onDragStart',
  'onDragEnd',
  'onDragEnter',
  'onDragLeave',
  'onDragOver',
  'onDrop',
  'onCopy',
  'onCut',
  'onPaste',
  'onAnimationStart',
  'onAnimationEnd',
  'onAnimationIteration',
  'onTransitionEnd',
]);

/**
 * The attribute names on one JSX opening tag, found by walking forward from
 * the tag and balancing braces so a `>` inside an expression does not end it.
 *
 * Written out rather than regexed for the reason the rest of this file is
 * regexed: `<PfInput ... onChange={(e) => e.target.value} />` contains a `>`
 * in an arrow function, so `<PfInput[^>]*>` stops in the middle of the tag and
 * reads half its attributes.
 */
function openingTagAttributes(masked, from) {
  let depth = 0;
  let index = from;
  const names = [];

  for (; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
    else if (char === '>' && depth === 0) break;
    else if (depth === 0 && /[A-Za-z]/.test(char)) {
      const rest = masked.slice(index);
      const match = /^([A-Za-z][A-Za-z0-9_-]*)\s*=/.exec(rest);
      if (match) {
        names.push({ name: match[1], at: index });
        index += match[1].length;
      }
    }
  }

  return names;
}

/** The 1-based line a character index falls on, for a readable report. */
const lineAt = (source, index) => source.slice(0, index).split('\n').length;

/**
 * Every handler in this file that its element cannot fire.
 *
 * Runs over `Pf*` tags whichever way they got there, so it audits a file this
 * run rewrote and a file ported by hand months ago alike.
 */
function auditHandlers(source, byBinding) {
  const masked = mask(source, { strings: true });
  const findings = [];

  for (const [binding, component] of byBinding) {
    const tag = new RegExp(`<${binding}(?=[\\s/>])`, 'g');
    for (const match of masked.matchAll(tag)) {
      for (const { name, at } of openingTagAttributes(masked, match.index + binding.length + 1)) {
        if (!/^on[A-Z]/.test(name)) continue;
        if (HOST_DOM_EVENTS.has(name)) continue;
        // `onPfChange` for `pfChange`, which is what the bindings expose.
        const expected = `pf${name.slice(4)}`;
        if (name.startsWith('onPf') && component.elementEvents.includes(expected)) continue;

        findings.push({
          line: lineAt(source, at),
          binding,
          prop: name,
          events: component.elementEvents,
          tag: component.tag,
        });
      }
    }
  }

  return findings.sort((a, b) => a.line - b.line);
}

function processFile(path) {
  const source = readFileSync(path, 'utf8');
  if (!source.includes(REACT_PACKAGE)) return null;

  // Comments masked, strings intact: the scan is looking for a string literal.
  const imports = readImports(source, mask(source, { strings: false }));
  // No named imports is not nothing to do: `main.tsx` has only
  // `import '@pitchfork-ui/react/styles.css'`, a side-effect import the scan
  // cannot see, and that is exactly the line a migration has to change.
  if (imports.length === 0) {
    let only = source;
    const sheets = [];
    for (const quote of ["'", '"']) {
      const from = `${quote}${REACT_PACKAGE}/styles.css${quote}`;
      if (only.includes(from)) {
        only = only.replaceAll(from, `${quote}@pitchfork-ui/elements/styles.css${quote}`);
        sheets.push(`${REACT_PACKAGE}/styles.css -> @pitchfork-ui/elements/styles.css`);
      }
    }
    if (sheets.length === 0) {
      return { path, skipped: ['mentions the package but imports nothing it can rewrite'] };
    }
    if (write) writeFileSync(path, only);
    return { path, applied: sheets, changed: true };
  }

  const imported = imports.flatMap((i) => i.names);
  const rewritable = [];
  const refusals = [];

  for (const { imported: name, local } of imported) {
    const component = byName.get(name);
    if (!component) {
      // A hook, a type, or `registerIcons` -- not a component, so there is no
      // binding to rename it to and the tool must not touch it.
      refusals.push({ name, local, reason: `not a component in the metadata`, props: [] });
      continue;
    }
    if (local !== name) {
      refusals.push({
        name,
        local,
        reason: `imported as \`${local}\`, so renaming it would change the alias too`,
        props: [],
      });
      continue;
    }
    if (component.absorbed) {
      refusals.push({
        name,
        local,
        reason: `absorbed by \`${component.tag}\` — ${component.how ?? 'see the guide'}`,
        props: [],
      });
      continue;
    }
    if (!component.dropIn) {
      const onlyEvents =
        component.unhandledEvents.length > 0 &&
        component.becomesSlot.length === 0 &&
        component.becomesChildren.length === 0 &&
        component.unmapped.length === 0;
      refusals.push({
        name,
        local,
        reason: onlyEvents
          ? `an event prop has no equivalent on \`${component.tag}\``
          : `the call site changes shape`,
        props: [
          ...component.becomesSlot.map((p) => `${p} -> slot`),
          ...component.becomesChildren.map((p) => `${p} -> child elements`),
          ...component.unmapped.map((p) => `${p} -> needs a destination`),
          ...component.unhandledEvents.map(
            (p) => `${p} -> no matching event on ${component.tag}; pick the right one`,
          ),
        ],
      });
      continue;
    }
    rewritable.push(component);
  }

  // A file is converted as far as it safely can be, and the rest is annotated.
  //
  // An earlier version refused the whole file whenever anything in it needed
  // reshaping, on the reasoning that importing from both packages is a worse
  // state than an untouched file. That reasoning was wrong: both packages are
  // published and a file importing from each compiles and runs, so a partial
  // conversion is the ordinary incremental path -- and refusing the whole file
  // made the tool do nothing at all on every file in `apps/demo`, since each
  // one imports at least one reshaped component.
  //
  // So the import splits: drop-ins move, the rest stay where they are under a
  // comment naming what each one needs.
  let next = source;
  const applied = [];

  // The import statements come out first, replaced by a placeholder, so the
  // renames below cannot touch them and no index drifts while they run.
  const PLACEHOLDER = '\u0000PF_IMPORTS\u0000';
  for (const statement of [...imports].reverse()) {
    next =
      next.slice(0, statement.start) +
      (statement === imports[0] ? PLACEHOLDER : '') +
      next.slice(statement.end);
  }

  for (const component of rewritable) {
    const binding = component.binding;
    // Re-masked each time, because the previous rename changed the text and
    // the offsets have to match what is being spliced. Strings and comments
    // are masked here, so a `Button` in either is left alone.
    // `\b` on both sides, so `Button` does not match inside `ButtonGroup`.
    const renamed = replaceOutsideLiterals(
      next,
      mask(next, { strings: true }),
      new RegExp(`\\b${component.name}\\b`),
      binding,
    );
    if (renamed.hits > 0) next = renamed.text;

    for (const event of component.events) {
      const handled = replaceOutsideLiterals(
        next,
        mask(next, { strings: true }),
        new RegExp(`\\b${event.from}(?=\\s*=\\s*\\{)`),
        event.to,
      );
      if (handled.hits > 0) {
        next = handled.text;
        applied.push(`${event.from} -> ${event.to}`);
      }
    }
  }

  const blocks = [];
  if (rewritable.length > 0) {
    const names = rewritable.map((c) => c.binding).sort();
    blocks.push(`import { ${names.join(', ')} } from '${ELEMENTS_PACKAGE}';`);
    // Recorded here rather than beside the body rename, because the import
    // moving is the change that always happens. A file that imports a
    // component without using it in JSX has nothing in its body to rename, so
    // reporting from there left the file changed with nothing said about it --
    // and the dependency check downstream reads these lines, so it saw no
    // reason to look at the manifest.
    for (const component of rewritable) {
      applied.push(`${component.name} -> ${component.binding}`);
    }
  }
  if (refusals.length > 0) {
    const lines = refusals.map((refusal) => {
      const detail = refusal.props.length > 0 ? `: ${refusal.props.join('; ')}` : '';
      return ` * - ${refusal.local}: ${refusal.reason}${detail}`;
    });
    blocks.push(
      [
        '/*',
        ` * TODO(pitchfork-ui): still on ${REACT_PACKAGE}, which is being retired.`,
        ` * Each of these needs the call site reshaped by hand -- see ${GUIDE}.`,
        ' *',
        ...lines,
        ' */',
        `import { ${refusals
          .map((r) => (r.local === r.name ? r.name : `${r.name} as ${r.local}`))
          .sort()
          .join(', ')} } from '${REACT_PACKAGE}';`,
      ].join('\n'),
    );
    applied.push(`annotated ${refusals.length} import(s) left on ${REACT_PACKAGE}`);
  }
  next = next.replace(PLACEHOLDER, blocks.join('\n'));

  // The stylesheet is a side-effect import with no named bindings, so the scan
  // above never sees it -- and the elements package ships the same token sheet.
  for (const quote of ["'", '"']) {
    const from = `${quote}${REACT_PACKAGE}/styles.css${quote}`;
    if (next.includes(from)) {
      next = next.replaceAll(from, `${quote}@pitchfork-ui/elements/styles.css${quote}`);
      applied.push(`${REACT_PACKAGE}/styles.css -> @pitchfork-ui/elements/styles.css`);
    }
  }

  if (next === source) return { path, applied: [] };
  if (write) writeFileSync(path, next);
  return { path, applied, changed: true };
}

/**
 * The nearest `package.json` above a file, and whether it declares the package
 * the codemod is rewriting imports to.
 *
 * Worth checking because a workspace hides the answer. `apps/demo` declares
 * only `@pitchfork-ui/react`, and after the rewrite a *forced* full
 * `tsc -b --force` still passed -- the specifier resolves from the hoisted root
 * `node_modules` whether the package asks for it or not. That is the same
 * silent gap `scripts/check-built-packages.mjs` exists for: it only shows up
 * for someone installing from the registry, by which point it is their problem.
 */
function declaresTarget(path) {
  let dir = dirname(path);
  const stop = process.cwd();
  for (;;) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      const json = JSON.parse(readFileSync(manifest, 'utf8'));
      const declared = new Set([
        ...Object.keys(json.dependencies ?? {}),
        ...Object.keys(json.peerDependencies ?? {}),
        ...Object.keys(json.optionalDependencies ?? {}),
      ]);
      return { manifest: relative(stop, manifest), declared };
    }
    const parent = dirname(dir);
    if (parent === dir || dir === stop) return null;
    dir = parent;
  }
}

function walk(target, found = []) {
  const stat = statSync(target);
  if (stat.isFile()) {
    if (EXTENSIONS.has(extname(target))) found.push(target);
    return found;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    walk(join(target, entry.name), found);
  }
  return found;
}

const files = targets.flatMap((t) => walk(t));
const results = files.map(processFile).filter(Boolean);

/*
 * The audit reads the file from disk *after* the rewrite, so with `--write` it
 * sees the renamed call sites this run produced -- which is the case that
 * matters, since the rename is what strands an `onChange` on an element. On a
 * dry run it reports what is already there, which is the same check a ported
 * app wants on its own.
 */
const handlerFindings = files.flatMap((path) => {
  const current = readFileSync(path, 'utf8');
  if (!current.includes(ELEMENTS_PACKAGE)) return [];
  return auditHandlers(current, byBinding).map((finding) => ({ ...finding, path }));
});

const changed = results.filter((r) => r.changed);
const blocked = results.filter((r) => r.refusals?.length);
const skipped = results.filter((r) => r.skipped);

if (!quiet) {
  for (const result of changed) {
    console.log(`${write ? 'rewrote' : 'would rewrite'} ${relative(process.cwd(), result.path)}`);
    for (const line of new Set(result.applied)) console.log(`    ${line}`);
  }
  for (const result of blocked) {
    console.log(`\nleft alone ${relative(process.cwd(), result.path)}`);
    for (const refusal of result.refusals) {
      console.log(`    ${refusal.name}: ${refusal.reason}`);
      for (const prop of refusal.props) console.log(`        ${prop}`);
    }
    if (result.rewritable.length > 0) {
      console.log(
        `    (${result.rewritable.length} drop-in import(s) here too, held back ` +
          `so the file is not left importing from both packages: ` +
          `${result.rewritable.join(', ')})`,
      );
    }
  }
  for (const result of skipped) {
    console.log(`\nskipped ${relative(process.cwd(), result.path)}: ${result.skipped.join('; ')}`);
  }
}

// Which manifests now need the packages the rewrite points at. Collected per
// manifest rather than per file, since one app is one answer.
const undeclared = new Map();
for (const result of results) {
  if (!result.changed) continue;
  const needs = new Set();
  if (result.applied.some((line) => line.includes(ELEMENTS_PACKAGE))) needs.add(ELEMENTS_PACKAGE);
  if (result.applied.some((line) => line.includes('@pitchfork-ui/elements/styles.css'))) {
    needs.add('@pitchfork-ui/elements');
  }
  // A rename to a `Pf*` binding means the bindings package is imported even
  // when the applied line does not spell the specifier out.
  if (result.applied.some((line) => / -> Pf/.test(line))) needs.add(ELEMENTS_PACKAGE);
  if (needs.size === 0) continue;

  const manifest = declaresTarget(result.path);
  if (!manifest) continue;
  for (const need of needs) {
    if (manifest.declared.has(need)) continue;
    if (!undeclared.has(manifest.manifest)) undeclared.set(manifest.manifest, new Set());
    undeclared.get(manifest.manifest).add(need);
  }
}

if (undeclared.size > 0 && !quiet) {
  console.log('');
  for (const [manifest, needs] of undeclared) {
    console.log(
      `warning: ${manifest} does not declare ${[...needs].join(' or ')}. ` +
        `Inside this workspace the import resolves from the hoisted root ` +
        `node_modules regardless -- a forced \`tsc -b --force\` passes -- so add it ` +
        `before anyone installs this from the registry.`,
    );
  }
}

if (handlerFindings.length > 0) {
  console.log(
    `\n${handlerFindings.length} handler(s) the element cannot fire — these ` +
      'type-check, render and never run:',
  );
  for (const finding of handlerFindings) {
    const events = finding.events.length > 0 ? finding.events.join(', ') : 'no events at all';
    console.log(
      `  ${relative(process.cwd(), finding.path)}:${finding.line}  ` +
        `<${finding.binding} ${finding.prop}> — ${finding.tag} emits ${events}`,
    );
  }
  process.exitCode = 1;
}

const verb = write ? 'rewrote' : 'would rewrite';
console.log(
  `\n${files.length} file(s) scanned, ${results.length} mention ${REACT_PACKAGE}: ` +
    `${verb} ${changed.length}, left ${blocked.length} alone for ${GUIDE}.`,
);
if (!write && changed.length > 0) console.log('Nothing was written. Pass --write to apply.');
