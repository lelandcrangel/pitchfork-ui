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
    'get_element',
    'get_examples',
    'get_tokens',
    'list_components',
    'list_elements',
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

// Icon kebab-cases a name and honours Font Awesome's own aliases before
// looking it up, so checking the raw literal against the canonical list alone
// rejects working code — which is worse than not checking at all.
test('validate_usage accepts the spellings Icon actually resolves', async () => {
  const out = await call('validate_usage', {
    code: [
      '<Icon name="bar-chart" />',
      '<Icon name="chartBar" />',
      '<Icon name="circleCheck" />',
      '<Icon name="circleInfo" />',
      '<Icon name="magnifyingGlass" />',
      '<EmptyState heading="Nothing here" iconName="folder-open" />',
    ].join('\n'),
  });
  assert.match(out, /No problems found/);
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

/* ------------------------------------------------------------------ *
 * The elements
 *
 * A second first-class layer, so every question an agent can ask about a
 * component it can ask about an element. Before these tools the server knew
 * only the 91 React components: `validate_usage` reported `<pf-button>` as
 * nothing at all, and an agent writing Angular or Vue had no grounding.
 * ------------------------------------------------------------------ */

test('list_elements lists every element, grouped by the same categories', async () => {
  const out = await call('list_elements');
  assert.match(out, /108 elements/);
  assert.match(out, /<pf-button>/);
  assert.match(out, /## navigation/);
});

test('list_elements can filter by category', async () => {
  const out = await call('list_elements', { category: 'forms' });
  assert.match(out, /<pf-input>/);
  assert.doesNotMatch(out, /<pf-button>/);
});

test('list_elements marks a child element and a form control', async () => {
  const out = await call('list_elements');
  assert.match(out, /<pf-option>.*inside `<pf-select>`/);
  assert.match(out, /<pf-input>.*form control/);
});

test('get_element returns props with their attributes, events, slots and parts', async () => {
  const out = await call('get_element', { name: 'pf-input' });
  assert.match(out, /# <pf-input>/);
  assert.match(out, /`pfChange`/, 'events should be listed');
  assert.match(out, /pf-input::part\(/, 'parts should name how to style them');
  assert.match(out, /Form-associated/, 'a control that submits should say so');
  assert.match(out, /checkValidity/, 'its async methods should be listed');
});

test('get_element takes the binding name as well as the tag', async () => {
  const byTag = await call('get_element', { name: 'pf-button' });
  const byName = await call('get_element', { name: 'PfButton' });
  assert.equal(byTag, byName);
});

/*
 * The property-only props are the elements' one genuinely surprising API
 * detail: an array or a function prop has no attribute, so markup cannot set
 * it. The element renders perfectly and the value never arrives.
 */
test('get_element says which props have no attribute', async () => {
  const out = await call('get_element', { name: 'pf-video-player' });
  assert.match(out, /_property only_/);
  assert.match(out, /Writing them in markup does nothing/);
});

test('get_element points at the React counterpart, and get_component back', async () => {
  const element = await call('get_element', { name: 'pf-button' });
  assert.match(element, /React counterpart: `Button`/);

  const component = await call('get_component', { name: 'Button' });
  assert.match(component, /Custom element: `<pf-button>`/);
});

/*
 * Four React components were absorbed into an element rather than ported one
 * for one. "There is no element for AreaChart" is wrong in the way that
 * matters: there is, it is a prop.
 */
test('get_component says how an absorbed component maps to an element', async () => {
  const out = await call('get_component', { name: 'AreaChart' });
  assert.match(out, /`<pf-line-chart>`/);
  assert.match(out, /set `area`/);
});

test('get_element redirects a React component name to its element', async () => {
  const out = await call('get_element', { name: 'Button' });
  assert.match(out, /is a React component, not an element/);
  assert.match(out, /`<pf-button>`/);
});

test('get_element suggests a near match for a typo', async () => {
  const out = await call('get_element', { name: 'pf-buton' });
  assert.match(out, /Did you mean `pf-button`\?/);
});

test('validate_usage accepts correct element markup', async () => {
  const out = await call('validate_usage', {
    code: '<pf-button variant="primary" size="lg" aria-label="Save">Save</pf-button>',
  });
  assert.match(out, /No problems found/);
});

test('validate_usage rejects an unknown element and an invalid value', async () => {
  const unknown = await call('validate_usage', { code: '<pf-buton>x</pf-buton>' });
  assert.match(unknown, /is not an element in this library/);

  const invalid = await call('validate_usage', {
    code: '<pf-button variant="ghostly">x</pf-button>',
  });
  assert.match(invalid, /not valid on `<pf-button>`/);
});

/*
 * Stencil normalises a union to double quotes ("ghost" | "primary") where the
 * React extractor reproduces the source's single ones. The union check
 * accepted only single quotes, so every variant check on every element passed
 * silently -- a validator that cannot fail is worse than none.
 */
test('validate_usage checks a union written with double quotes', async () => {
  const out = await call('validate_usage', { code: '<pf-badge variant="primary">x</pf-badge>' });
  assert.match(out, /Expected one of: "brand", "danger", "neutral", "success", "warning"/);
});

test('validate_usage flags an attribute the element does not have', async () => {
  const out = await call('validate_usage', { code: '<pf-button tone="loud">x</pf-button>' });
  assert.match(out, /has no attribute `tone`/);
});

test('validate_usage flags a prop that has no attribute, written as one', async () => {
  const out = await call('validate_usage', {
    code: '<pf-video-player sources="clip.mp4"></pf-video-player>',
  });
  assert.match(out, /has no attribute — setting it in markup does nothing/);
});

test('validate_usage warns about the property name where the attribute is kebab-case', async () => {
  const out = await call('validate_usage', {
    code: '<pf-time-picker hourCycle="12"></pf-time-picker>',
  });
  assert.match(out, /the attribute is `hour-cycle`/);
});

test('validate_usage passes a framework binding syntax it cannot judge', async () => {
  const out = await call('validate_usage', {
    code:
      '<pf-input :value="email" @pf-change="onChange" v-if="ready" />\n' +
      '<pf-input [formControl]="email" (pfChange)="onChange($event)" />',
  });
  assert.match(out, /No problems found/);
});

/*
 * `<PfButton>` is a real component, from a bindings package. Reporting it as
 * "not exported by the library" sends an agent hunting a typo it has not made.
 */
test('validate_usage recognises a generated binding used in JSX', async () => {
  const out = await call('validate_usage', { code: '<PfButton variant="primary">Go</PfButton>' });
  assert.match(out, /generated binding for `<pf-button>`/);
  assert.match(out, /elements-react/);
});
