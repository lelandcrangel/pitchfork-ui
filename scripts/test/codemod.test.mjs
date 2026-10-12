/**
 * The codemod, driven over real files in a temporary directory.
 *
 * node:test, so it needs no extra dependency -- the same reason the MCP
 * server's tests use it.
 *
 * Two of these exist because the first implementation got them wrong, and both
 * were silent:
 *
 *   - "reads a multi-line named import" failed because the scan masked string
 *     literals and then looked for one, so *every* file reported "imports
 *     nothing from it" and the tool did nothing while reporting success.
 *   - "leaves an identifier inside a string or a comment alone" failed because
 *     the renames ran over the raw source. The file's own comment claimed the
 *     mask handled it; nothing checked.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODEMOD = join(ROOT, 'scripts', 'codemod-react-to-elements.mjs');

/** Write `files` into a fresh directory, run the codemod, read them back. */
function run(files, { write = true, args = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pf-codemod-'));
  // A manifest declaring the target, so the dependency warning -- which has
  // its own test -- does not fire in every other case.
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      dependencies: {
        '@pitchfork-ui/react': '*',
        '@pitchfork-ui/elements': '*',
        '@pitchfork-ui/elements-react': '*',
      },
    }),
  );
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  /*
   * The handler audit exits 1 when it finds something, so a fixture written
   * to trigger it would make `execFileSync` throw and take the assertions
   * with it. The output is what the test is about either way, so both are
   * read off the error.
   */
  let stdout;
  let exitCode = 0;
  try {
    stdout = execFileSync(
      process.execPath,
      [CODEMOD, ...(write ? ['--write'] : []), ...args, dir],
      { cwd: ROOT, encoding: 'utf8' },
    );
  } catch (error) {
    if (error.stdout === undefined) throw error;
    stdout = error.stdout;
    exitCode = error.status;
  }
  const after = Object.fromEntries(
    Object.keys(files).map((name) => [name, readFileSync(join(dir, name), 'utf8')]),
  );
  return { stdout, after, dir, exitCode };
}

test('renames a drop-in component and the import specifier', () => {
  const { after } = run({
    'a.tsx': [
      "import { Button } from '@pitchfork-ui/react';",
      '',
      'export const Save = () => <Button variant="primary" onClick={save}>Save</Button>;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /import \{ PfButton \} from '@pitchfork-ui\/elements-react';/);
  assert.match(after['a.tsx'], /<PfButton variant="primary"/);
  assert.doesNotMatch(after['a.tsx'], /@pitchfork-ui\/react/);
});

test('leaves onClick alone, because pf-button emits no pfClick', () => {
  // `onClick` is not in `Button`'s own props -- it comes from extending
  // `ButtonHTMLAttributes`, so it is React's native handler on the host, and
  // `pf-button` declares no events at all. An `onPfClick` here would be a prop
  // nothing fires.
  const { after } = run({
    'a.tsx': [
      "import { Button } from '@pitchfork-ui/react';",
      'export const Save = () => <Button onClick={save}>Save</Button>;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /onClick=\{save\}/);
  assert.doesNotMatch(after['a.tsx'], /onPfClick/);
});

test('renames an event prop the element really emits', () => {
  // `pf-alert` emits `pfDismiss`, so `onDismiss` -> `onPfDismiss` is real.
  // Alert is not a drop-in, so the rename is reported rather than applied --
  // which is what the annotation is for.
  const { after } = run({
    'a.tsx': [
      "import { Alert } from '@pitchfork-ui/react';",
      'export const X = () => <Alert onDismiss={hide} />;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /TODO\(pitchfork-ui\)/);
  assert.match(after['a.tsx'], /import \{ Alert \} from '@pitchfork-ui\/react';/);
});

test('refuses a component whose event prop has no element equivalent', () => {
  // The quiet one: `Slider` maps one to one on every other prop, and
  // `pf-slider` emits `pfChange` rather than `pfValueChange`. Renaming the
  // component and keeping `onValueChange` compiles and never fires.
  const { after } = run({
    'a.tsx': [
      "import { Slider } from '@pitchfork-ui/react';",
      'export const X = () => <Slider onValueChange={set} />;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /an event prop has no equivalent on `pf-slider`/);
  assert.match(after['a.tsx'], /onValueChange -> no matching event on pf-slider/);
  assert.doesNotMatch(after['a.tsx'], /PfSlider/);
});

test('reads a multi-line named import', () => {
  // The regression that made the tool a no-op on every real file.
  const { after, stdout } = run({
    'a.tsx': [
      'import {',
      '  Button,',
      '  Card,',
      "} from '@pitchfork-ui/react';",
      '',
      'export const X = () => <Card><Button>go</Button></Card>;',
    ].join('\n'),
  });
  assert.doesNotMatch(stdout, /imports nothing/);
  assert.match(after['a.tsx'], /PfButton/);
  assert.match(after['a.tsx'], /PfCard/);
});

test('does not match a shorter component name inside a longer one', () => {
  const { after } = run({
    'a.tsx': [
      "import { Button, ButtonGroup } from '@pitchfork-ui/react';",
      'export const X = () => <ButtonGroup><Button>go</Button></ButtonGroup>;',
    ].join('\n'),
  });
  // ButtonGroup is data-driven, so it stays; Button is a drop-in and moves.
  assert.doesNotMatch(after['a.tsx'], /PfButtonGroup/);
  assert.match(after['a.tsx'], /<PfButton>go<\/PfButton>/);
  assert.match(after['a.tsx'], /<ButtonGroup>/);
});

test('leaves an identifier inside a string or a comment alone', () => {
  const { after } = run({
    'a.tsx': [
      "import { Button } from '@pitchfork-ui/react';",
      '',
      '// Button is the one we use.',
      "const label = 'Button';",
      '/* Button again */',
      'export const X = () => <Button>{label}</Button>;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /\/\/ Button is the one we use\./, 'the line comment changed');
  assert.match(after['a.tsx'], /const label = 'Button';/, 'the string literal changed');
  assert.match(after['a.tsx'], /\/\* Button again \*\//, 'the block comment changed');
  assert.match(after['a.tsx'], /<PfButton>\{label\}<\/PfButton>/, 'the JSX was not renamed');
});

test('annotates a reshaped component and leaves it on the old package', () => {
  const { after } = run({
    'a.tsx': [
      "import { Button, Select } from '@pitchfork-ui/react';",
      'export const X = () => <><Button>go</Button><Select options={o} /></>;',
    ].join('\n'),
  });
  const text = after['a.tsx'];
  assert.match(text, /import \{ PfButton \} from '@pitchfork-ui\/elements-react';/);
  assert.match(text, /import \{ Select \} from '@pitchfork-ui\/react';/);
  assert.match(text, /TODO\(pitchfork-ui\)/);
  assert.match(text, /Select: the call site changes shape: options -> child elements/);
  // The reshaped call site itself is untouched -- a guessed rewrite is the
  // thing this tool exists not to do.
  assert.match(text, /<Select options=\{o\} \/>/);
});

test('names the element for a component an element absorbed', () => {
  const { after } = run({
    'a.tsx': [
      "import { NotificationStack } from '@pitchfork-ui/react';",
      'export const X = () => <NotificationStack />;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /NotificationStack: absorbed by `pf-toaster`/);
  assert.match(after['a.tsx'], /import \{ NotificationStack \} from '@pitchfork-ui\/react';/);
});

test('refuses an aliased import rather than renaming the alias', () => {
  const { after } = run({
    'a.tsx': [
      "import { Button as PfLegacyButton } from '@pitchfork-ui/react';",
      'export const X = () => <PfLegacyButton>go</PfLegacyButton>;',
    ].join('\n'),
  });
  assert.match(after['a.tsx'], /imported as `PfLegacyButton`/);
  assert.match(after['a.tsx'], /<PfLegacyButton>go<\/PfLegacyButton>/);
});

test('rewrites a stylesheet-only side-effect import', () => {
  const { after } = run({ 'main.tsx': "import '@pitchfork-ui/react/styles.css';\n" });
  assert.equal(after['main.tsx'], "import '@pitchfork-ui/elements/styles.css';\n");
});

test('writes nothing without --write', () => {
  const source = "import { Button } from '@pitchfork-ui/react';\n";
  const { after, stdout } = run({ 'a.tsx': source }, { write: false });
  assert.equal(after['a.tsx'], source);
  assert.match(stdout, /Nothing was written/);
});

test('warns when the manifest does not declare the package it rewrites to', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pf-codemod-bare-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'bare', dependencies: { '@pitchfork-ui/react': '*' } }),
  );
  writeFileSync(join(dir, 'a.tsx'), "import { Button } from '@pitchfork-ui/react';\n");
  const stdout = execFileSync(process.execPath, [CODEMOD, dir], { cwd: ROOT, encoding: 'utf8' });
  assert.match(stdout, /does not declare @pitchfork-ui\/elements-react/, stdout);
});

test('leaves a non-component export alone', () => {
  const { after } = run({
    'a.tsx': ["import { registerIcons } from '@pitchfork-ui/react';", 'registerIcons({});'].join(
      '\n',
    ),
  });
  assert.match(after['a.tsx'], /registerIcons: not a component in the metadata/);
  assert.match(after['a.tsx'], /import \{ registerIcons \} from '@pitchfork-ui\/react';/);
});

/*
 * The handler audit. It exists because the rename alone ships a silent
 * defect: `Switch.onChange` is React's own synthetic handler, inherited from
 * `InputHTMLAttributes` rather than declared, so it is in no metadata and the
 * migration map never sees it -- and `pf-switch` emits `pfChange` and no
 * native `change`. The renamed call site type-checks, renders and never fires.
 */
test('reports a handler the element cannot fire, and exits 1', () => {
  const { stdout, exitCode } = run({
    'a.tsx': [
      "import { Switch } from '@pitchfork-ui/react';",
      'export const Toggle = () => <Switch checked={on} onChange={(e) => set(e.target.checked)} />;',
    ].join('\n'),
  });

  assert.match(stdout, /<PfSwitch onChange>/);
  assert.match(stdout, /pf-switch emits pfChange/);
  assert.equal(exitCode, 1);
});

test('accepts the element own event, renamed', () => {
  const { stdout, exitCode } = run({
    'a.tsx': [
      "import { Switch } from '@pitchfork-ui/elements-react';",
      "import { PfSwitch } from '@pitchfork-ui/elements-react';",
      'export const Toggle = () => <PfSwitch onPfChange={(e) => set(e.detail.checked)} />;',
    ].join('\n'),
  });

  assert.doesNotMatch(stdout, /cannot fire/);
  assert.equal(exitCode, 0);
});

/*
 * A DOM event a host really fires is not a finding. `onClick` on a `pf-button`
 * is the common case, and reporting it would bury the real ones.
 */
test('accepts a DOM event on a host', () => {
  const { stdout, exitCode } = run({
    'a.tsx': [
      "import { PfButton } from '@pitchfork-ui/elements-react';",
      'export const Save = () => <PfButton onClick={save} onKeyDown={keys}>Save</PfButton>;',
    ].join('\n'),
  });

  assert.doesNotMatch(stdout, /cannot fire/);
  assert.equal(exitCode, 0);
});

/*
 * The audit runs on a file this run never rewrote, which is what makes it
 * useful on an app ported months ago -- and is how it found five dead handlers
 * in `apps/demo` after that port was already committed.
 */
test('audits an already-ported file that mentions neither rename', () => {
  const { stdout, exitCode } = run({
    'a.tsx': [
      "import { PfInput } from '@pitchfork-ui/elements-react';",
      'export const Field = () => <PfInput onChange={(e) => set(e.target.value)} />;',
    ].join('\n'),
  });

  assert.match(stdout, /<PfInput onChange>/);
  assert.match(stdout, /pf-input emits pfChange, pfInput/);
  assert.equal(exitCode, 1);
});

/*
 * The tag scan balances braces rather than matching `<PfInput[^>]*>`: the
 * handler's own arrow function contains a `>`, so the regex stops in the
 * middle of the tag and reads half its attributes. This fixture puts the
 * handler first, so a `[^>]*` scan would never reach `onBogus`.
 */
test('reads attributes past a > inside an expression', () => {
  const { stdout } = run({
    'a.tsx': [
      "import { PfInput } from '@pitchfork-ui/elements-react';",
      'export const Field = () => (',
      '  <PfInput',
      '    onClick={(e) => e.preventDefault()}',
      '    value={v}',
      '    onBogusThing={handler}',
      '  />',
      ');',
    ].join('\n'),
  });

  assert.match(stdout, /<PfInput onBogusThing>/);
});

test('leaves a handler inside a string or a comment alone', () => {
  const { stdout, exitCode } = run({
    'a.tsx': [
      "import { PfButton } from '@pitchfork-ui/elements-react';",
      "const doc = '<PfInput onChange={x} />';",
      '// <PfSwitch onChange={y} />',
      'export const Save = () => <PfButton>{doc}</PfButton>;',
    ].join('\n'),
  });

  assert.doesNotMatch(stdout, /cannot fire/);
  assert.equal(exitCode, 0);
});
