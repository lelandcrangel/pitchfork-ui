/**
 * The server with no React metadata anywhere, which is what a consumer sees
 * once `packages/react` is gone.
 *
 * Its own file, with its own client, because the state has to be set up around
 * the spawn: `server.test.mjs` shares one connection across every test and
 * this one needs a different world. The package's test script therefore runs
 * with `--test-concurrency=1`: these two files cannot run at once, because this
 * one moves a file the other's server may read. It passes either way in this
 * workspace -- `server.test.mjs` resolves the React metadata through the
 * `node_modules` symlink rather than the bundled copy -- but that is luck, not
 * isolation, and the suites together take under a second.
 *
 * Two things have to be arranged, and the first version of this test arranged
 * neither, so it reported a happily working React layer:
 *
 *   1. **The bundled copy.** `data/metadata.json` is the last candidate `load`
 *      tries and it sits beside the server's own source, so it is found
 *      whatever the env says -- which is exactly what makes
 *      `npx @pitchfork-ui/mcp` work with no install. It is moved aside here,
 *      which is the state `scripts/build-mcp-data.mjs` now produces: a missing
 *      source deletes the stale bundled copy rather than leaving it to answer
 *      for a package that no longer exists.
 *   2. **The cwd.** `load` also resolves `@pitchfork-ui/react/metadata` as
 *      though required from the working directory, and inside this workspace
 *      that always succeeds -- `node_modules/@pitchfork-ui/react` is a symlink
 *      to `packages/react`. So the server runs from a temporary directory with
 *      no `node_modules` above it, with the two required artifacts passed by
 *      absolute path.
 */

import assert from 'node:assert/strict';
import { test, after, before } from 'node:test';
import { existsSync, mkdtempSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundled = join(pkgRoot, 'data/metadata.json');

let client;
let parked = null;

before(async () => {
  const scratch = mkdtempSync(join(tmpdir(), 'pf-mcp-retired-'));

  if (existsSync(bundled)) {
    parked = join(scratch, 'metadata.json');
    renameSync(bundled, parked);
  }

  client = new Client({ name: 'pitchfork-ui-retired-tests', version: '0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [join(pkgRoot, 'src/index.mjs')],
      cwd: scratch,
      env: {
        ...process.env,
        PITCHFORK_UI_ELEMENTS: join(pkgRoot, 'data/elements.json'),
        PITCHFORK_UI_TOKENS: join(pkgRoot, 'data/tokens.json'),
        PITCHFORK_UI_METADATA: '',
      },
    }),
  );
});

const restore = () => {
  if (parked && existsSync(parked) && !existsSync(bundled)) renameSync(parked, bundled);
};

after(async () => {
  await client?.close();
  restore();
});

// Belt and braces: a crash between `before` and `after` would otherwise leave
// the bundled artifact in a temporary directory, and the next run of anything
// reading it would quietly answer as though React were already retired.
process.on('exit', restore);

const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  return result.content[0].text;
};

/*
 * The server has to start at all. It used to require the React metadata, so a
 * consumer who had installed only `@pitchfork-ui/elements` got a server that
 * refused to run, over an artifact belonging to a package they had no reason
 * to have.
 */
test('starts with no React metadata', async () => {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 9, 'every tool stays listed');
});

/*
 * The three React tools stay listed and explain themselves. A tool that
 * vanishes is worse than one that says where the API went: an agent holding a
 * `Button` it found in the consumer's own code would otherwise get "no such
 * tool" and nothing to go on.
 */
for (const [name, args] of [
  ['list_components', {}],
  ['search_components', { query: 'upload a file' }],
  ['get_component', { name: 'Button' }],
]) {
  test(`${name} says the React layer is retired`, async () => {
    const out = await call(name, args);
    assert.match(out, /@pitchfork-ui\/react has been retired/);
    // And points at what to call instead, with the real element count.
    assert.match(out, /108 custom elements/);
    assert.match(out, /`list_elements`/);
    assert.match(out, /@pitchfork-ui\/elements-react/);
  });
}

test('the element tools are unaffected', async () => {
  assert.match(await call('list_elements'), /^108 elements/);
  assert.match(await call('get_element', { name: 'pf-button' }), /^# <pf-button>/);
  assert.match(await call('get_examples', { name: 'pf-select' }), /pf-option/);
  assert.match(await call('get_tokens', { group: 'color' }), /color/);
});

/*
 * `validate_usage` reads the icon registry and the element API, both of which
 * used to come from the React metadata for element markup as well. If either
 * had stayed there this would report a clean snippet.
 */
test('validate_usage still catches a bad enum on an element', async () => {
  const out = await call('validate_usage', {
    code: '<pf-button variant="ghostly">Save</pf-button>',
  });
  assert.match(out, /1 error/);
  assert.match(out, /`variant="ghostly"` is not valid on `<pf-button>`/);
});

test('validate_usage still checks icon names', async () => {
  const out = await call('validate_usage', { code: '<pf-icon name="paper-plane"></pf-icon>' });
  assert.match(out, /paper-plane/);
});

/*
 * The conventions become the elements' own set. While the React package is
 * installed the React set is appended under its own heading; with it gone
 * there is nothing to append, and nothing about `forwardRef` or the
 * `pf-field` wrapper reaches an agent writing element markup.
 */
test('get_conventions returns the element rules and no React ones', async () => {
  const out = await call('get_conventions');
  assert.match(out, /^# Web components/);
  assert.match(out, /::part\(/, 'the custom-property-versus-part split is in there');
  assert.doesNotMatch(out, /Deprecated: @pitchfork-ui\/react/);
  assert.doesNotMatch(out, /forwardRef/);
});
