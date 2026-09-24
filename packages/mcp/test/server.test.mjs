/**
 * End-to-end check of the MCP server: spawns it over stdio with a real client
 * and exercises each tool. Uses node:test so it needs no extra dependency.
 */

import assert from 'node:assert/strict';
import { test, after, before } from 'node:test';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let client;

before(async () => {
  client = new Client({ name: 'pitchfork-ui-tests', version: '0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [join(pkgRoot, 'src/index.mjs')],
      cwd: pkgRoot,
    }),
  );
});

after(async () => {
  await client?.close();
});

const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  return result.content[0].text;
};

test('exposes every documented tool', async () => {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    'get_component',
    'get_conventions',
    'get_examples',
    'get_tokens',
    'list_components',
    'search_components',
    'validate_usage',
  ]);
});

test('get_component returns props, theme variables and an example', async () => {
  const out = await call('get_component', { name: 'Badge' });
  assert.match(out, /# Badge/);
  assert.match(out, /'neutral'/, 'variant union should be expanded');
  assert.match(out, /--pf-badge-brand-background/, 'theme aliases should be listed');
  assert.match(out, /```tsx/, 'an example should be included');
});

test('get_component suggests a near match for a typo', async () => {
  const out = await call('get_component', { name: 'Buttonn' });
  assert.match(out, /Did you mean: Button\?/);
});

test('search_components matches on whole words, not substrings', async () => {
  const out = await call('search_components', { query: 'upload a file' });
  assert.match(out, /FileUploader/);
  // "file" must not match inside "profile" (Avatar's description).
  assert.doesNotMatch(out, /Avatar/);
});

test('list_components can filter by category', async () => {
  const out = await call('list_components', { category: 'feedback' });
  assert.match(out, /Alert/);
  assert.doesNotMatch(out, /\*\*Button\*\*/);
});

test('get_tokens can return a single group', async () => {
  const out = await call('get_tokens', { group: 'color' });
  assert.match(out, /Tokens — color/);
  assert.match(out, /brand/);
});

test('get_conventions returns the house rules', async () => {
  const out = await call('get_conventions');
  assert.match(out, /CSS variable inheritance chain/);
});

test('validate_usage accepts correct code', async () => {
  const out = await call('validate_usage', {
    code: '<Badge variant="brand">New</Badge>\n<Alert variant="info" heading="Hi" />',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage catches an invalid variant value', async () => {
  const out = await call('validate_usage', { code: '<Badge variant="primary">New</Badge>' });
  assert.match(out, /not valid on `Badge`/);
  assert.match(out, /"neutral"/);
});

test('validate_usage catches an unknown component', async () => {
  const out = await call('validate_usage', { code: '<Buton>Go</Buton>' });
  assert.match(out, /not exported by the library/);
  assert.match(out, /Did you mean `Button`\?/);
});

test('validate_usage catches a misspelled prop', async () => {
  const out = await call('validate_usage', { code: '<Alert varient="info" />' });
  assert.match(out, /has no prop `varient`/);
  assert.match(out, /Did you mean `variant`\?/);
});

// Icon resolves an explicit registry, not all of Font Awesome, and `IconName`
// widens to `string` -- so an unregistered name typechecks, renders nothing,
// and is exactly the kind of mistake this tool exists to catch.
test('validate_usage catches an icon name the library does not resolve', async () => {
  const out = await call('validate_usage', { code: '<Icon name="paper-plane" />' });
  assert.match(out, /is not an icon the library resolves/);
  assert.match(out, /registerIcons/);
});

test('validate_usage suggests the nearest icon name', async () => {
  const out = await call('validate_usage', { code: '<Icon name="circle-chek" />' });
  assert.match(out, /Did you mean `"circle-check"`\?/);
});

test('validate_usage checks iconName on components that render one', async () => {
  const out = await call('validate_usage', {
    code: '<MetricCard heading="Applications" value={5} iconName="hourglass" />',
  });
  assert.match(out, /`iconName="hourglass"`/);
});

test('validate_usage accepts a registered icon name', async () => {
  const out = await call('validate_usage', {
    code: '<Icon name="circle-check" />\n<EmptyState heading="None" iconName="chart-bar" />',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage flags a hardcoded colour', async () => {
  const out = await call('validate_usage', { code: "<div style={{ color: '#4f46e5' }} />" });
  assert.match(out, /Hardcoded colour/);
});

test('validate_usage does not flag legitimate passthrough props', async () => {
  const out = await call('validate_usage', {
    code: '<Badge className="x" data-testid="y" aria-label="z" onClick={fn} id="q" />',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage does not require children when they are nested', async () => {
  const out = await call('validate_usage', {
    code: '<Popover label="About" trigger={<Button>Why?</Button>}>\n  <p>Detail</p>\n</Popover>',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage handles escaped quotes in an attribute value', async () => {
  const out = await call('validate_usage', {
    code: '<EmptyState heading="No results for \\"dashboard\\"" />',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage does not mistake nested JSX for attributes', async () => {
  const out = await call('validate_usage', {
    code: '<Modal open title="Confirm" footer={<><Button>Cancel</Button><Button>OK</Button></>} />',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage reports an invented prop even with no near match', async () => {
  const out = await call('validate_usage', { code: '<Alert severity="error" />' });
  assert.match(out, /has no prop `severity`/);
  assert.match(out, /not a DOM attribute/);
  assert.match(out, /`variant`/, 'should list the real props');
});

test('validate_usage stays quiet when a prop list is known to be partial', async () => {
  // Icon extends FontAwesomeIconProps, which we cannot enumerate.
  const out = await call('validate_usage', { code: '<Icon name="circle-check" spin />' });
  assert.match(out, /No problems found/);
});

test('validate_usage accepts every documented example', async () => {
  // The strongest false-positive check available: every extracted example is
  // real, working code lifted from the docs.
  const { metadata } = await import('../src/data.mjs');
  const { validateUsage } = await import('../src/validate.mjs');
  const { componentsByName } = await import('../src/data.mjs');

  const failures = [];
  let checked = 0;
  for (const component of metadata.components) {
    for (const example of component.examples ?? []) {
      checked += 1;
      for (const finding of validateUsage(example.code, componentsByName)) {
        if (finding.severity === 'error') {
          failures.push(`${component.name}/${example.name}: ${finding.message}`);
        }
      }
    }
  }

  assert.ok(checked > 200, `expected a substantial corpus, got ${checked}`);
  assert.deepEqual(failures, [], 'no documented example should fail validation');
});

test('validate_usage still sees attributes after an escaped quote containing ">"', async () => {
  // The tag scanner must not treat `\"` as ending the string, or it terminates
  // the tag at the wrong `>` and silently stops checking the rest.
  const out = await call('validate_usage', {
    code: '<Alert heading="x \\" > y" variant="nonsense" />',
  });
  assert.match(out, /not valid on `Alert`/);
});

test('validate_usage still sees attributes after a braced value with an escaped quote', async () => {
  // skipBraced must skip escapes too, or `\"` closes the string, the closing
  // `}` is read as part of it, and every later attribute is swallowed.
  const out = await call('validate_usage', {
    code: '<Alert heading={"x \\" y"} variant="nonsense" />',
  });
  assert.match(out, /not valid on `Alert`/);
});

test('validate_usage does not demand a required prop when a spread could supply it', async () => {
  const out = await call('validate_usage', { code: '<Carousel {...props} />' });
  assert.match(out, /No problems found/);
});

test('validate_usage still checks written attributes alongside a spread', async () => {
  // A spread excuses a *missing* required prop, not an invalid written value.
  const out = await call('validate_usage', {
    code: '<Badge {...rest} variant="primary">New</Badge>',
  });
  assert.match(out, /not valid on `Badge`/);
});

test('get_examples includes stories whose args use shorthand properties', async () => {
  // Carousel's meta supplies its required prop as `args: { slides }`, a
  // shorthand property. Dropping those leaves it with no usable example.
  const out = await call('get_examples', { name: 'Carousel' });
  assert.match(out, /slides=\{slides\}/);
});
