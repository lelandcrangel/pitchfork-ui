#!/usr/bin/env node
/**
 * Every public export of `@pitchfork-ui/react` must carry `@deprecated`.
 *
 * The 0.16.0 changelog announces, as a BREAKING CHANGE, that "every export of
 * @pitchfork-ui/react is marked @deprecated". Nothing checked it, and it was
 * not true: 90 of 282 exports carried the tag. The 90 were the components. The
 * other 192 were 20 runtime values — every hook, the four a11y helpers, the
 * three icon-registry functions, `toast` and `useToast` — and 172 exported
 * types. A consumer importing `useDisclosure` or `registerIcons` saw nothing
 * in their editor at all, and those are exactly the exports somebody uses
 * without touching a component.
 *
 * The editor tag is the deprecation notice a developer actually meets. The
 * `npm deprecate` flag shows at install time, once; the README shows on a page
 * they may never open. This one shows every time they type the name.
 *
 * Reads the real public API through the TypeScript checker rather than
 * grepping for the string, because what matters is the tag on the *exported
 * symbol*: a re-export carries its own tag, an aliased symbol may carry the
 * original's, and a grep sees neither distinction. Measured while writing
 * this: a JSDoc comment on an individual export specifier is honoured on the
 * re-exported symbol and does NOT reach the symbol it aliases — which is what
 * lets `a11y/index.ts` deprecate the import path for `Keys` and friends
 * without deprecating `@pitchfork-ui/core`, where they actually live and
 * where they are not deprecated at all.
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const entry = resolve(root, 'packages/react/src/index.ts');

// Phase 7 deletes the package. A check for a package that is gone is not a
// failure, the same reasoning as scripts/run-workspace.mjs.
if (!existsSync(entry)) {
  console.log('packages/react is not here — nothing to check.');
  process.exit(0);
}

// `@pitchfork-ui/core` is mapped to its *sources*, so this check cannot change
// its answer with the build state. It did once: `HourCycle` and
// `ListNavigationAction` are `export type { X }` re-exports of core types, and
// they read as tagged until core's dist existed and the alias resolved to the
// real declaration. A check whose answer depends on whether something else was
// built is a check that passes on the wrong machine.
const program = ts.createProgram([entry], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  noEmit: true,
  baseUrl: root,
  paths: { '@pitchfork-ui/core': [join(root, 'packages/core/src/index.ts')] },
});
const checker = program.getTypeChecker();
const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(entry));

if (!moduleSymbol) {
  console.error(`Could not read the public API of ${entry}.`);
  process.exit(1);
}

const VALUE_FLAGS =
  ts.SymbolFlags.Variable |
  ts.SymbolFlags.Function |
  ts.SymbolFlags.Class |
  ts.SymbolFlags.Enum |
  ts.SymbolFlags.BlockScopedVariable;

/**
 * Where the tag physically sits matters. An export specifier —
 * `export { Keys } from '@pitchfork-ui/core'` with the JSDoc on the name —
 * is the shape that silently fails, so it does not count as tagged here.
 *
 * Measured on this package's own `dist/index.d.ts`: opened as a path the
 * checker reports `own=[deprecated]`; reached as `@pitchfork-ui/react` it
 * reports `own=[]`. A consumer only ever does the second. Six exports sat in
 * exactly that state — `Keys`, `composeDescribedBy`, `getFocusableElements`,
 * `isActivationKey`, `HourCycle`, `ListNavigationAction` — tagged in the
 * source, invisible to anyone installing the package, and a source-only
 * check called them done. Re-declaring the binding
 * (`export const Keys = coreKeys`) puts the tag on a declaration this package
 * owns, which survives; the values are identical, so `Keys === core.Keys`.
 */
const taggedOnlyOnASpecifier = (symbol) =>
  (symbol.getDeclarations() ?? []).some(
    (d) => ts.isExportSpecifier(d) && ts.getJSDocCommentsAndTags(d).length > 0,
  );

const untagged = { value: [], type: [] };
const specifierOnly = [];
let tagged = 0;

for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const ownTag = (symbol.getJsDocTags(checker) ?? []).some((t) => t.name === 'deprecated');
  const aliasedTag = (resolved.getJsDocTags(checker) ?? []).some((t) => t.name === 'deprecated');

  if (ownTag && !aliasedTag && taggedOnlyOnASpecifier(symbol)) {
    specifierOnly.push(symbol.getName());
  } else if (ownTag || aliasedTag) {
    tagged += 1;
  } else {
    untagged[resolved.flags & VALUE_FLAGS ? 'value' : 'type'].push(symbol.getName());
  }
}

const total = tagged + untagged.value.length + untagged.type.length + specifierOnly.length;
const missing = untagged.value.length + untagged.type.length + specifierOnly.length;

if (!missing) {
  console.log(`@pitchfork-ui/react: all ${total} public exports carry @deprecated.`);
  process.exit(0);
}

console.error(`@pitchfork-ui/react: ${missing} of ${total} public exports carry no @deprecated.\n`);
// Values first: a runtime export with no notice is the one a consumer can
// import and use without ever meeting a deprecated component.
for (const [kind, names] of [
  ['runtime value', untagged.value],
  ['type', untagged.type],
]) {
  if (!names.length) continue;
  console.error(`  ${names.length} ${kind}(s):`);
  for (const name of names.sort()) console.error(`    ${name}`);
  console.error('');
}
if (specifierOnly.length) {
  console.error(`  ${specifierOnly.length} tagged only on an export specifier:`);
  for (const name of specifierOnly.sort()) console.error(`    ${name}`);
  console.error(
    '\n  That tag is lost across the package boundary: a consumer importing from\n' +
      "  '@pitchfork-ui/react' sees nothing. Re-declare the binding instead --\n" +
      '  import it under another name and export a tagged const or type alias.\n',
  );
}
console.error(
  'The package is deprecated, so its whole public API says so. Add a one-line\n' +
    '`/** @deprecated … */` naming the replacement — the element for a component,\n' +
    '`@pitchfork-ui/core` for anything that only lives here as a re-export.',
);
process.exit(1);
