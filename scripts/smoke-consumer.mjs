#!/usr/bin/env node
// smoke-consumer.mjs
//
// Renders a BUILT consumer app in a real browser and asserts its Pitchfork
// elements both upgraded and picked up the design tokens.
//
// This exists for the reason smoke-storybook.mjs exists: a component can
// render perfect markup with no tokens at all, and nothing errors. 0.15.1
// shipped that way with every unit test passing. The difference here is the
// resolution path -- these apps import the published wrapper packages through
// their exports maps, not source through an alias, which is the path a
// workspace alias hides.
//
//   node scripts/smoke-consumer.mjs --dir apps/consumer-react/dist --label react
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
  console.error('smoke-consumer: --dir <built app directory> is required');
  process.exit(1);
}
const label = args.label ?? args.dir;
// --dir is given relative to the repository root, but npm runs workspace
// scripts with cwd set to the package.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = isAbsolute(args.dir) ? args.dir : resolve(repoRoot, args.dir);

/** Every element the app is expected to have upgraded. */
const EXPECTED = [
  'pf-button',
  'pf-badge',
  'pf-tag',
  'pf-avatar',
  'pf-kbd',
  'pf-input',
  'pf-icon',
  'pf-card',
  'pf-card-header',
  'pf-card-content',
  'pf-card-footer',
  'pf-content-divider',
  'pf-visually-hidden',
  'pf-loading-spinner',
  'pf-loading-dots',
  'pf-loading-skeleton',
  'pf-utility-button',
  'pf-scroll-area',
  'pf-badge-group',
  'pf-progress-bar',
  'pf-progress-circle',
  'pf-credit-card',
  'pf-toolbar',
  'pf-toolbar-separator',
  'pf-pagination',
  'pf-checkbox',
  'pf-switch',
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
    // A built SPA serves index.html for unknown paths.
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

  const report = await page.evaluate((expected) => {
    const result = { missing: [], notUpgraded: [], unstyled: [], tokens: {} };

    const rootStyle = getComputedStyle(document.documentElement);
    for (const token of ['--color-semantic-action-primary', '--space-2', '--radius-md']) {
      result.tokens[token] = rootStyle.getPropertyValue(token).trim();
    }

    for (const tag of expected) {
      const el = document.querySelector(tag);
      if (!el) {
        result.missing.push(tag);
        continue;
      }
      /*
       * A shadow root exists only once the component has upgraded and
       * rendered, so its presence is the whole signal. Counting children
       * instead would fail a content-free element: pf-toolbar-separator is
       * a styled hairline and renders nothing inside itself.
       */
      if (!customElements.get(tag) || !el.shadowRoot) {
        result.notUpgraded.push(tag);
      }
    }

    // The clearest token-reached-the-page signal: a primary button's
    // background comes from --pf-button-primary-bg, which chains to a token.
    const button = document.querySelector('pf-button[variant="primary"]');
    const inner = button?.shadowRoot?.querySelector('button');
    if (inner) {
      const background = getComputedStyle(inner).backgroundColor;
      if (!background || background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
        result.unstyled.push(`pf-button primary background is "${background}"`);
      }
      result.buttonBackground = background;
    }

    /*
     * Each new element brings new --pf-* aliases, and a missing alias is
     * invisible: the element upgrades, the markup is right, and the colour
     * silently resolves to nothing. These are the cheapest assertions that
     * would catch it -- one per alias group added since pf-button.
     */
    const transparent = (value) =>
      !value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent';

    const card = document.querySelector('pf-card');
    if (card) {
      const style = getComputedStyle(card);
      if (transparent(style.backgroundColor)) {
        result.unstyled.push(`pf-card background is "${style.backgroundColor}"`);
      }
      if (transparent(style.borderTopColor)) {
        result.unstyled.push(`pf-card border is "${style.borderTopColor}"`);
      }
      // --pf-card-radius has no theme alias; it falls back to a token.
      if (parseFloat(style.borderTopLeftRadius) <= 0) {
        result.unstyled.push(`pf-card radius is "${style.borderTopLeftRadius}"`);
      }
    }

    // A new alias group: --pf-utility-btn-*. The button is in the shadow root.
    const utility = document
      .querySelector('pf-utility-button[variant="brand"]')
      ?.shadowRoot?.querySelector('button');
    if (utility) {
      const background = getComputedStyle(utility).backgroundColor;
      if (transparent(background)) {
        result.unstyled.push(`pf-utility-button brand background is "${background}"`);
      }
    }

    /*
     * @keyframes do not cross a shadow boundary, so each of these elements
     * carries its own copy. A copy that went missing would leave the element
     * static and otherwise perfect -- exactly the kind of silence this script
     * exists to break.
     *
     * getAnimations(), not getComputedStyle().animationName: the computed
     * style reports whatever `animation` declared, resolved keyframes or not,
     * so it cannot tell the two apart. getAnimations() returns nothing when
     * the name matches no @keyframes in the element's tree -- measured by
     * deleting the rule and watching this fire.
     */
    const animated = [
      ['pf-loading-spinner', null],
      ['pf-loading-skeleton', null],
      ['pf-loading-dots', '.dot'],
    ];
    for (const [tag, inner] of animated) {
      const host = document.querySelector(tag);
      if (!host) continue;
      const target = inner ? host.shadowRoot?.querySelector(inner) : host;
      if (!target) {
        result.unstyled.push(`${tag} is missing ${inner}`);
        continue;
      }
      if (target.getAnimations().length === 0) {
        const declared = getComputedStyle(target).animationName;
        result.unstyled.push(
          `${tag} declares animation "${declared}" but runs none — its @keyframes copy is missing`,
        );
      }
    }

    // The host is the scroll container, and the host is what takes focus.
    const scroller = document.querySelector('pf-scroll-area');
    if (scroller) {
      if (getComputedStyle(scroller).overflowY !== 'auto') {
        result.unstyled.push('pf-scroll-area does not scroll vertically');
      }
      if (scroller.getAttribute('tabindex') !== '0') {
        result.unstyled.push('pf-scroll-area is not keyboard-focusable');
      }
      if (scroller.scrollHeight <= scroller.clientHeight) {
        result.unstyled.push('pf-scroll-area has nothing to scroll — the fixture is wrong');
      }
    }

    // --pf-progress-*: the track and the drawn arc both chain to tokens.
    const bar = document.querySelector('pf-progress-bar');
    const barFill = bar?.shadowRoot?.querySelector('[part="fill"]');
    const barTrack = bar?.shadowRoot?.querySelector('[part="track"]');
    if (barFill && barTrack) {
      if (transparent(getComputedStyle(barFill).backgroundColor)) {
        result.unstyled.push('pf-progress-bar fill has no background');
      }
      if (transparent(getComputedStyle(barTrack).backgroundColor)) {
        result.unstyled.push('pf-progress-bar track has no background');
      }
      // value=30 max=60 is half drawn; the fill is set as a percentage width.
      const drawn = barFill.getBoundingClientRect().width;
      const whole = barTrack.getBoundingClientRect().width;
      if (whole <= 0 || Math.abs(drawn / whole - 0.5) > 0.02) {
        result.unstyled.push(`pf-progress-bar fill is ${drawn}/${whole}, expected about half`);
      }
    }

    const arc = document
      .querySelector('pf-progress-circle')
      ?.shadowRoot?.querySelector('[part="fill"]');
    if (arc && transparent(getComputedStyle(arc).stroke)) {
      result.unstyled.push('pf-progress-circle arc has no stroke');
    }

    // --pf-credit-card-*: the brand gradient is a background-image, not a colour.
    const card2 = document.querySelector('pf-credit-card[brand="visa"]');
    if (card2) {
      const style = getComputedStyle(card2);
      if (style.backgroundImage === 'none') {
        result.unstyled.push('pf-credit-card has no brand gradient');
      }
      if (transparent(style.color)) {
        result.unstyled.push('pf-credit-card has no text colour');
      }
    }

    // --pf-badgegroup-*: the badge and the message share one outline.
    const group = document.querySelector('pf-badge-group');
    const groupBadge = group?.shadowRoot?.querySelector('[part="badge"]');
    if (groupBadge && transparent(getComputedStyle(groupBadge).backgroundColor)) {
      result.unstyled.push('pf-badge-group badge has no background');
    }

    /*
     * The toolbar is one tab stop from outside. Asserted against a real build
     * because the mock DOM does not support `:not(:disabled)`, so the unit
     * project cannot tell an item list from a list of every control.
     */
    const toolbar = document.querySelector('pf-toolbar');
    if (toolbar) {
      const style = getComputedStyle(toolbar);
      if (transparent(style.backgroundColor)) {
        result.unstyled.push('pf-toolbar has no background');
      }
      if (style.display !== 'flex') {
        result.unstyled.push(`pf-toolbar display is "${style.display}"`);
      }
      const stops = Array.from(toolbar.querySelectorAll('[data-toolbar-item]')).filter(
        (item) => item.getAttribute('tabindex') === '0',
      );
      if (stops.length !== 1) {
        result.unstyled.push(`pf-toolbar has ${stops.length} tab stops, expected 1`);
      }
    }

    // The separator is a hairline on the axis across the toolbar's own.
    const separator = document.querySelector('pf-toolbar-separator');
    if (separator) {
      const style = getComputedStyle(separator);
      if (transparent(style.backgroundColor)) {
        result.unstyled.push('pf-toolbar-separator has no background');
      }
      if (style.width !== '1px') {
        result.unstyled.push(`pf-toolbar-separator width is "${style.width}", expected 1px`);
      }
      if (separator.getBoundingClientRect().height <= 0) {
        result.unstyled.push('pf-toolbar-separator has no height to stretch into');
      }
    }

    /*
     * Pagination is the one element here whose state the host app holds, so
     * this checks the round trip: click next, and the app's echo follows. A
     * broken event or a wrapper that drops `detail` would leave the page
     * buttons rendering perfectly and the number frozen.
     */
    const pager = document.querySelector('pf-pagination');
    if (pager) {
      const current = () => pager.shadowRoot?.querySelector('[part~="current"]')?.textContent;
      const activeBg = pager.shadowRoot?.querySelector('.page--active');
      if (activeBg && transparent(getComputedStyle(activeBg).backgroundColor)) {
        result.unstyled.push('pf-pagination current page has no background');
      }
      result.pagerBefore = current();
      pager.shadowRoot?.querySelector('[part~="next"]')?.click();
      result.pagerClicked = true;
    }

    /*
     * Form association, against a real build: a shadow-DOM <input> reaches no
     * surrounding form on its own, so this is the claim ElementInternals is
     * there to make good. Both apps put a checkbox and a switch in a <form>.
     */
    const prefs = document.querySelector('[data-testid="prefs"]');
    if (prefs instanceof HTMLFormElement) {
      const names = [...new FormData(prefs).keys()].sort();
      // terms starts unticked (absent), notify starts on (present).
      if (names.join(',') !== 'notify') {
        result.unstyled.push(
          `form sees [${names.join(', ')}] from pf-checkbox/pf-switch, expected just notify`,
        );
      }
      const box = prefs.querySelector('pf-checkbox');
      if (box && typeof box.checkValidity === 'function') {
        result.requiredBoxValid = prefs.checkValidity();
      }
      const native = box?.shadowRoot?.querySelector('input');
      if (native && transparent(getComputedStyle(native).borderTopColor)) {
        result.unstyled.push('pf-checkbox has no border');
      }
      const toggle = document.querySelector('pf-switch')?.shadowRoot?.querySelector('input');
      if (toggle && transparent(getComputedStyle(toggle).backgroundColor)) {
        result.unstyled.push('pf-switch track has no background');
      }
    } else {
      result.unstyled.push('the consumer app has no [data-testid="prefs"] form');
    }

    const rule = document.querySelector('pf-content-divider')?.shadowRoot?.querySelector('.line');
    if (rule) {
      const background = getComputedStyle(rule).backgroundColor;
      if (transparent(background)) {
        result.unstyled.push(`pf-content-divider rule background is "${background}"`);
      }
      if (rule.getBoundingClientRect().width <= 0) {
        result.unstyled.push('pf-content-divider rule has no width');
      }
    }

    return result;
  }, EXPECTED);

  if (report.pagerClicked) {
    // Stencil's queue is async and the host framework re-renders after that.
    const after = await page
      .waitForFunction(
        (before) => {
          const pager = document.querySelector('pf-pagination');
          const current = pager?.shadowRoot?.querySelector('[part~="current"]')?.textContent;
          const echo = document.querySelector('[data-testid="page-echo"]')?.textContent;
          return current !== before && echo?.includes(current ?? '\u0000')
            ? { current, echo }
            : null;
        },
        report.pagerBefore,
        { timeout: 5_000 },
      )
      .then((handle) => handle.jsonValue())
      .catch(() => null);

    if (!after) {
      const state = await page.evaluate(() => ({
        current: document
          .querySelector('pf-pagination')
          ?.shadowRoot?.querySelector('[part~="current"]')?.textContent,
        echo: document.querySelector('[data-testid="page-echo"]')?.textContent,
      }));
      problems.push(
        `pf-pagination: clicking next left the page at "${state.current}" and the app echo at "${state.echo}" (was page "${report.pagerBefore}")`,
      );
    }
  }

  /*
   * A required checkbox left unticked must make its form invalid. If the
   * validity never reached ElementInternals the form would report valid, and
   * a consumer's submit guard would wave the empty value through.
   */
  if (report.requiredBoxValid === true) {
    problems.push(
      'a form holding an unticked required pf-checkbox reports itself valid — ' +
        'setValidity is not reaching the form',
    );
  }

  for (const tag of report.missing) problems.push(`${tag} did not render`);
  for (const tag of report.notUpgraded) problems.push(`${tag} rendered but never upgraded`);
  problems.push(...report.unstyled);

  for (const [token, value] of Object.entries(report.tokens)) {
    if (!value) problems.push(`${token} resolved to nothing — the token stylesheet is missing`);
  }

  if (consoleErrors.length > 0) {
    problems.push(`console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  }

  if (problems.length === 0) {
    console.log(
      `smoke-consumer(${label}): ${EXPECTED.length} elements upgraded and styled ` +
        `(primary button background ${report.buttonBackground})`,
    );
  }
} catch (error) {
  problems.push(String(error));
} finally {
  await browser.close();
  server.close();
}

if (problems.length > 0) {
  console.error(`smoke-consumer(${label}) failed:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
