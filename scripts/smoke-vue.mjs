#!/usr/bin/env node
// smoke-vue.mjs
//
// Renders the BUILT Vue consumer app in a real browser and asserts the three
// things only the Vue bindings can get wrong.
//
// Deliberately not `smoke-consumer.mjs --label vue`: that script asserts every
// one of the 108 elements and its layout, which is what the React and Angular
// consumers are for. Rendering all of them a third time would prove nothing
// new about the *bindings*, which is what this package is. What it checks
// instead:
//
//   1. `@pitchfork-ui/elements-vue` resolves through its exports map and
//      registers the elements it imports -- the path a workspace alias hides.
//   2. `v-model` round-trips in **both** directions on the six controls the
//      output target models. A binding that only listens to the element's
//      events looks correct until the application writes to the ref.
//   3. The token stylesheet reaches a Vue-rendered shadow root the same way it
//      reaches a React-rendered one.
//
//   node scripts/smoke-vue.mjs --dir apps/consumer-vue/dist
//
// Set PW_CHROMIUM_PATH when the environment already has a Chromium that
// Playwright's pinned build does not match.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}
if (!args.dir) {
  console.error('smoke-vue: --dir <built app directory> is required');
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = isAbsolute(args.dir) ? args.dir : resolve(repoRoot, args.dir);

/** Every element the Vue app imports, all of which must upgrade. */
const EXPECTED = [
  'pf-alert',
  'pf-badge',
  'pf-button',
  'pf-checkbox',
  'pf-input',
  'pf-radio-button',
  'pf-radio-group',
  'pf-slider',
  'pf-switch',
  'pf-textarea',
];

/** The six controls `v-model` is configured for, and what each one models. */
const MODELLED = [
  { testid: 'input', echo: 'email-echo', property: 'value', next: 'grace@example.com' },
  { testid: 'textarea', echo: 'notes-echo', property: 'value', next: 'A second note.' },
  { testid: 'radio-group', echo: 'plan-echo', property: 'value', next: 'free' },
  { testid: 'slider', echo: 'volume-echo', property: 'value', next: 7 },
  { testid: 'checkbox', echo: 'notify-echo', property: 'checked', next: false },
  { testid: 'switch', echo: 'dark-echo', property: 'checked', next: true },
];

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const path = join(root, normalize(requested === '/' ? '/index.html' : requested));

  if (!path.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }

  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    try {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(await readFile(join(root, 'index.html')));
    } catch {
      res.writeHead(404).end();
    }
  }
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
const problems = [];
const consoleErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(String(error)));

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => customElements.get('pf-button') !== undefined, {
    timeout: 15_000,
  });

  // ── 1. The bindings resolved and registered their elements ──────────────
  const upgrade = await page.evaluate(async (expected) => {
    const result = { missing: [], notUpgraded: [], tokens: {} };

    const rootStyle = getComputedStyle(document.documentElement);
    for (const token of ['--color-semantic-action-primary', '--space-3', '--radius-md']) {
      result.tokens[token] = rootStyle.getPropertyValue(token).trim();
    }

    for (const tag of expected) {
      const element = document.querySelector(tag);
      if (!element) {
        result.missing.push(tag);
        continue;
      }
      // An unupgraded custom element has no shadow root, which is also what
      // an element the bindings failed to register looks like.
      if (!element.shadowRoot) result.notUpgraded.push(tag);
    }

    const button = document.querySelector('pf-button');
    const inner = button?.shadowRoot?.querySelector('[part="button"]');
    result.buttonBackground = inner ? getComputedStyle(inner).backgroundColor : null;
    result.alertBackground = (() => {
      const box = document.querySelector('pf-alert')?.shadowRoot?.querySelector('[part="alert"]');
      return box ? getComputedStyle(box).backgroundColor : null;
    })();

    return result;
  }, EXPECTED);

  for (const tag of upgrade.missing) problems.push(`${tag} did not render`);
  for (const tag of upgrade.notUpgraded) {
    problems.push(`${tag} rendered but never upgraded — the Vue binding did not register it`);
  }
  for (const [token, value] of Object.entries(upgrade.tokens)) {
    if (!value) problems.push(`${token} resolved to nothing — the token stylesheet is missing`);
  }
  if (!upgrade.buttonBackground || upgrade.buttonBackground === 'rgba(0, 0, 0, 0)') {
    problems.push('the primary button has no background — the tokens did not reach a shadow root');
  }
  if (!upgrade.alertBackground || upgrade.alertBackground === 'rgba(0, 0, 0, 0)') {
    problems.push('the alert has no background — its variant attribute did not reach the sheet');
  }

  // ── 2. v-model, element → application ───────────────────────────────────
  for (const control of MODELLED) {
    const outcome = await page.evaluate(async ({ testid, echo, property, next }) => {
      const element = document.querySelector(`[data-testid="${testid}"]`);
      const output = document.querySelector(`[data-testid="${echo}"]`);
      if (!element || !output) return { error: `no ${testid} or ${echo} in the page` };

      const before = output.textContent?.trim();

      /*
       * Set the property and let the element announce it, which is the path
       * a person's interaction takes. The binding listens for `pfChange`.
       */
      element[property] = next;
      element.dispatchEvent(
        new CustomEvent('pfChange', { detail: { [property]: next }, bubbles: true }),
      );

      const deadline = Date.now() + 2000;
      while (output.textContent?.trim() === before) {
        if (Date.now() > deadline) {
          return { error: `the echo stayed at "${before}"`, before };
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      return { before, after: output.textContent?.trim() };
    }, control);

    if (outcome.error) {
      problems.push(`v-model (element → app) on ${control.testid}: ${outcome.error}`);
    } else if (outcome.after !== String(control.next)) {
      problems.push(
        `v-model (element → app) on ${control.testid} reported "${outcome.after}", ` +
          `expected "${control.next}"`,
      );
    }
  }

  // ── 3. v-model, application → element ───────────────────────────────────
  /*
   * The direction a binding that only listens to events gets wrong, and the
   * reason this app has a button that writes to every ref at once. Clicking
   * it must push the new values back down into the controls.
   */
  const written = await page.evaluate(async (modelled) => {
    document.querySelector('[data-testid="reset"]')?.click();

    const expected = {
      input: 'reset@example.com',
      textarea: 'Reset.',
      'radio-group': 'free',
      slider: 9,
      checkbox: false,
      switch: true,
    };

    const read = () =>
      Object.fromEntries(
        modelled.map(({ testid, property }) => [
          testid,
          document.querySelector(`[data-testid="${testid}"]`)?.[property],
        ]),
      );

    const matches = () =>
      Object.entries(expected).every(([testid, value]) => String(read()[testid]) === String(value));

    const deadline = Date.now() + 3000;
    while (!matches()) {
      if (Date.now() > deadline) return { expected, actual: read(), settled: false };
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return { expected, actual: read(), settled: true };
  }, MODELLED);

  if (!written.settled) {
    for (const [testid, value] of Object.entries(written.expected)) {
      const actual = written.actual[testid];
      if (String(actual) !== String(value)) {
        problems.push(
          `v-model (app → element) on ${testid} left the control at "${actual}", ` +
            `expected "${value}"`,
        );
      }
    }
  }

  if (consoleErrors.length > 0) {
    problems.push(`console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length > 0) {
  console.error('smoke-vue failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `smoke-vue: ${EXPECTED.length} elements upgraded through the Vue bindings, ` +
    `v-model round-trips on ${MODELLED.length} controls, tokens resolve.`,
);
