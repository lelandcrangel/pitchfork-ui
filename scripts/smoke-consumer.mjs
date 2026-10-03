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
  'pf-bar-chart',
  'pf-badge',
  'pf-tag',
  'pf-avatar',
  'pf-kbd',
  'pf-input',
  'pf-header-navigation',
  'pf-file-uploader',
  'pf-gauge-chart',
  'pf-heatmap',
  'pf-icon',
  'pf-card',
  'pf-carousel',
  'pf-carousel-slide',
  'pf-card-header',
  'pf-card-content',
  'pf-card-footer',
  'pf-content-divider',
  'pf-visually-hidden',
  'pf-loading-spinner',
  'pf-loading-dots',
  'pf-loading-skeleton',
  'pf-utility-button',
  'pf-resizable',
  'pf-rich-text-editor',
  'pf-scroll-area',
  'pf-badge-group',
  'pf-progress-bar',
  'pf-progress-circle',
  'pf-credit-card',
  'pf-toolbar',
  'pf-toolbar-separator',
  'pf-pagination',
  'pf-chart-series',
  'pf-checkbox',
  'pf-sidebar-navigation',
  'pf-sparkline',
  'pf-switch',
  'pf-textarea',
  'pf-slider',
  'pf-radio-group',
  'pf-radar-axis',
  'pf-radar-chart',
  'pf-radio-button',
  'pf-tooltip',
  'pf-pie-chart',
  'pf-pie-slice',
  'pf-popover',
  'pf-line-chart',
  'pf-modal',
  'pf-nav-item',
  'pf-modal-header',
  'pf-modal-body',
  'pf-modal-footer',
  'pf-dropdown',
  'pf-context-menu',
  'pf-menu-item',
  'pf-menu-separator',
  'pf-slideout-menu',
  'pf-nav-section',
  'pf-notification',
  'pf-toaster',
  'pf-command-palette',
  'pf-command-group',
  'pf-command-item',
  'pf-calendar',
  'pf-date-picker',
  'pf-time-picker',
  'pf-date-range-picker',
  'pf-select',
  'pf-option',
  'pf-combobox',
  'pf-multi-select',
  'pf-tag-input',
  'pf-tabs',
  'pf-tab',
  'pf-tab-panel',
  'pf-accordion',
  'pf-accordion-item',
  'pf-code-snippet',
  'pf-collapsible',
  'pf-breadcrumbs',
  'pf-breadcrumb',
  'pf-progress-steps',
  'pf-progress-step',
  'pf-timeline',
  'pf-timeline-item',
  'pf-rating-stars',
  'pf-rating-badge',
  'pf-empty-state',
  'pf-metric-grid',
  'pf-metric-card',
  'pf-page-header',
  'pf-section-header',
  'pf-section-footer',
  'pf-avatar-group',
  'pf-button-group',
  'pf-button-group-item',
  'pf-inline-cta',
  'pf-number-input',
  'pf-table',
  'pf-table-row',
  'pf-table-cell',
  'pf-tree-view',
  'pf-tree-item',
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

/*
 * The same test as the one inside page.evaluate, in Node scope: that closure's
 * copy cannot be reached from the assertions that run out here.
 */
const isTransparent = (value) => !value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent';
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

  const report = await page.evaluate(async (expected) => {
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

    /*
     * The --pf-menu-* inheritance bridge, which is the one claim about these
     * menus that no test in packages/elements can make: neither Vitest project
     * applies `styleUrl` CSS, so there a shared pf-menu-item has no computed
     * colour at all. The item reads a generic set; each container maps that set
     * to its own alias family; custom properties cross the shadow boundary by
     * inheritance. If a container forgot a mapping, the item falls back to an
     * unset variable and the text is left at the UA default rather than the
     * menu's own colour -- visible here and nowhere else.
     */
    for (const container of ['pf-dropdown', 'pf-context-menu']) {
      const item = document.querySelector(`${container} pf-menu-item`);
      if (!item) {
        result.unstyled.push(`${container} has no pf-menu-item child`);
        continue;
      }
      const resolved = getComputedStyle(item).getPropertyValue('--pf-menu-text').trim();
      if (!resolved) {
        result.unstyled.push(`${container} does not pass --pf-menu-text down to its pf-menu-item`);
      }
      // The colour is declared on :host and inherited by the label, so the
      // host is where to read it.
      if (transparent(getComputedStyle(item).color)) {
        result.unstyled.push(`${container} pf-menu-item has no text colour`);
      }
      // A destructive item must resolve to a *different* colour than a plain
      // one, or the mapping is present but pointing at the same alias.
      const destructive = document.querySelector(`${container} pf-menu-item[destructive]`);
      if (destructive) {
        const danger = getComputedStyle(destructive)
          .getPropertyValue('--pf-menu-text-danger')
          .trim();
        if (!danger) {
          result.unstyled.push(`${container} does not pass --pf-menu-text-danger down`);
        } else if (danger === resolved) {
          result.unstyled.push(
            `${container} maps --pf-menu-text-danger to the same value as --pf-menu-text ` +
              `("${danger}") -- a destructive item is indistinguishable`,
          );
        }
      }
      const separator = document.querySelector(`${container} pf-menu-separator`);
      if (separator && transparent(getComputedStyle(separator).backgroundColor)) {
        result.unstyled.push(`${container} pf-menu-separator has no background`);
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
      /*
       * The fill's width is transitioned, and Angular sets `value` as a
       * property after hydration — so the bar animates from empty and a
       * straight read here lands mid-transition. Measured: 1 run in 3 came
       * back at 84-86 of an expected 90, which read as a broken percentage
       * rather than as the flake it was. `Animation.finished` resolves at once
       * when nothing is running, so this costs the React app nothing.
       */
      await Promise.all(barFill.getAnimations().map((animation) => animation.finished));

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
      /*
       * The radio group's invariant, against a real build: one name, one
       * value, however many children. A set of independent form-associated
       * elements sharing a name would submit one entry each.
       */
      const group = prefs.querySelector('pf-radio-group');
      if (group) {
        const entries = [...new FormData(prefs).entries()].filter(([key]) => key === 'plan');
        if (entries.length !== 1) {
          result.unstyled.push(
            `pf-radio-group submitted ${entries.length} values for one name, expected 1`,
          );
        }
        const allRadios = [...group.querySelectorAll('pf-radio-button')];
        const nativeChecked = () =>
          allRadios.filter((radio) => radio.shadowRoot?.querySelector('input')?.checked);
        if (nativeChecked().length !== 1) {
          result.unstyled.push(
            `pf-radio-group has ${nativeChecked().length} radios checked, expected exactly 1`,
          );
        }
        /*
         * Clicking a different choice is what makes the invariant observable:
         * the initial state has one radio checked no matter what the group
         * does, so only a selection change can show it failing to clear the
         * previous one.
         */
        const unchecked = allRadios.find(
          (radio) => !radio.shadowRoot?.querySelector('input')?.checked,
        );
        if (unchecked) {
          /*
           * The `value` *property*, not the attribute: the generated React and
           * Angular wrappers set properties, so the attribute is absent — the
           * first version of this check read the attribute, got null, and
           * silently skipped itself.
           */
          result.radioBefore = nativeChecked().map((r) => r.value)[0] ?? '';
          unchecked.shadowRoot.querySelector('input').click();
          result.radioClickedValue = unchecked.value;
        }
        const stops = [...group.querySelectorAll('pf-radio-button')].filter(
          (radio) => radio.getAttribute('tabindex') === '0',
        );
        if (stops.length !== 1) {
          result.unstyled.push(`pf-radio-group has ${stops.length} tab stops, expected 1`);
        }
      }

      const names = [...new FormData(prefs).keys()].sort();
      /*
       * The two kinds of absence, in one check. `terms` is an unticked
       * checkbox, so it is absent from the submission entirely. `notes` is a
       * text control that may be empty, so it is present with an empty value —
       * a distinction a server relies on, and one `setFormValue('')` would
       * erase for the checkbox.
       */
      const expectedNames =
        'at,colours,colours,due,fruit,notes,notify,plan,quantity,topics,topics,' +
        'trip-end,trip-start,volume';
      if (names.join(',') !== expectedNames) {
        result.unstyled.push(
          `form sees [${names.join(', ')}] from the form controls, ` +
            `expected ${expectedNames} (colours and topics twice each, one entry per ` +
            'value) (terms is unticked, so absent)',
        );
      }
      /*
       * The values, not just the names. The time picker displays a 12-hour
       * clock and submits a canonical 24-hour value, which is the one claim
       * worth making about it — a control whose submitted value changed with
       * its display would be unusable on a server. The date picker's ISO
       * value is the same kind of claim.
       */
      const submitted = new FormData(prefs);
      /*
       * The stepper submits its value as a string, which is what a form
       * carries. An *empty* field submits an empty string rather than "0" —
       * the distinction `parseNumberValue` exists for — and the browser spec
       * covers that case, since clearing the field here would cost the
       * submission check its value.
       */
      const quantity = submitted.get('quantity');
      if (quantity !== '2') {
        result.unstyled.push(`pf-number-input submitted "${quantity}", expected 2`);
      }
      const at = submitted.get('at');
      if (at !== '14:30') {
        result.unstyled.push(
          `pf-time-picker submitted "${at}" but shows a 12-hour clock — ` +
            'expected the canonical 24-hour 14:30',
        );
      }
      const due = submitted.get('due');
      if (due !== '2024-03-15') {
        result.unstyled.push(`pf-date-picker submitted "${due}", expected 2024-03-15`);
      }
      const shown = document
        .querySelector('pf-time-picker')
        ?.shadowRoot?.querySelector('[part="trigger"]')
        ?.textContent?.trim();
      if (!shown?.includes('2:30 PM')) {
        result.unstyled.push(
          `pf-time-picker shows "${shown}", expected a 12-hour 2:30 PM beside its 14:30 value`,
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

    /*
     * The claim the overlay wave rests on: a `popover` opened from inside a
     * shadow root escapes an ancestor's `overflow` and stacking context. That
     * is what `createPortal` does for the React library and the only
     * equivalent available to a custom element. Both apps put the tooltip in a
     * 120x40 clipping box with a z-index:999 sibling after it.
     */
    const tip = document.querySelector('pf-tooltip');
    const clip = document.querySelector('[data-testid="tooltip-clip"]');
    const tipPanel = tip?.shadowRoot?.querySelector('[part="tooltip"]');
    if (tipPanel && clip) {
      const panelBox = tipPanel.getBoundingClientRect();
      const clipBox = clip.getBoundingClientRect();

      if (panelBox.width <= 0 || panelBox.height <= 0) {
        result.unstyled.push('pf-tooltip panel has no size — the popover never opened');
      } else {
        // Wider than its clipping ancestor, so it is demonstrably not clipped.
        if (panelBox.width <= clipBox.width) {
          result.unstyled.push(
            `pf-tooltip panel is ${Math.round(panelBox.width)}px wide inside a ` +
              `${Math.round(clipBox.width)}px clip box — it is being clipped`,
          );
        }
        // And it wins the hit test at its own centre, over the z-index rival.
        const hit = document.elementFromPoint(
          panelBox.left + panelBox.width / 2,
          panelBox.top + panelBox.height / 2,
        );
        if (!hit || !(tip.contains(hit) || hit === tip)) {
          result.unstyled.push(
            `pf-tooltip panel lost the top layer to <${hit?.tagName?.toLowerCase() ?? 'nothing'}>`,
          );
        }
      }

      if (transparent(getComputedStyle(tipPanel).backgroundColor)) {
        result.unstyled.push('pf-tooltip panel has no background');
      }

      // The trigger's accessible description is copied text, not an IDREF.
      const described = tip.firstElementChild?.getAttribute('aria-description');
      if (!described) {
        result.unstyled.push('pf-tooltip did not describe its trigger');
      }
    }

    /*
     * pf-modal leans on the browser for the focus trap, Escape and the
     * backdrop. The page-scroll lock is the one part it does itself —
     * measured: `showModal()` does not stop the page scrolling behind it — so
     * that is what a real build needs to confirm, as a full open/close round
     * trip through the host app's own state.
     */
    const modal = document.querySelector('pf-modal');
    const modalDialog = modal?.shadowRoot?.querySelector('dialog');
    if (modalDialog) {
      if (modalDialog.open) {
        result.unstyled.push('pf-modal started open — the fixture is wrong');
      } else {
        result.modalBefore = document.documentElement.style.overflow;
        const opener = [...document.querySelectorAll('pf-button')].find(
          (b) => b.textContent?.trim() === 'Open modal',
        );
        if (!opener) {
          result.unstyled.push('the consumer app has no "Open modal" button');
        } else {
          opener.shadowRoot?.querySelector('button')?.click();
          result.modalClicked = true;
        }
      }
    }

    /*
     * The notification's variant colours come through a `color-mix()` on top
     * of the alias chain, which only resolves against a real stylesheet, and
     * its role comes from core's liveRegionRole. A `warning` in the page is
     * the one case that pins both at once.
     */
    const pageNotification = document.querySelector('pf-notification[variant="warning"]');
    const notificationBox = pageNotification?.shadowRoot?.querySelector('[part="notification"]');
    if (!notificationBox) {
      result.unstyled.push('the consumer app has no warning pf-notification');
    } else {
      if (notificationBox.getAttribute('role') !== 'alert') {
        result.unstyled.push(
          `pf-notification[variant=warning] announces as ` +
            `"${notificationBox.getAttribute('role')}", expected alert`,
        );
      }
      const style = getComputedStyle(notificationBox);
      if (transparent(style.backgroundColor)) {
        result.unstyled.push('pf-notification has no background — the color-mix chain broke');
      }
      if (transparent(style.borderTopColor)) {
        result.unstyled.push('pf-notification has no border colour');
      }
      const glyph = pageNotification.shadowRoot
        ?.querySelector('pf-icon')
        ?.shadowRoot?.querySelector('svg');
      if (!glyph) {
        result.unstyled.push('pf-notification did not render its variant icon');
      }
    }

    /*
     * Which edge the slideout lands on, and that its panel really animates.
     * Neither is assertable in packages/elements: no `styleUrl` CSS is applied
     * in either Vitest project, so there the panel has the UA's `margin: auto`
     * and nothing animates at all.
     *
     * The animation check is `getAnimations()` rather than `animationName`,
     * and it is here because of a bug it would have caught: pf-modal animated
     * with `var(--duration-medium)`, a token that does not exist, which makes
     * the whole shorthand invalid at computed-value time — `animation-name`
     * computes to `none` and nothing runs. Measured.
     */
    const slideoutDialog = document
      .querySelector('pf-slideout-menu')
      ?.shadowRoot?.querySelector('dialog');
    if (!slideoutDialog) {
      result.unstyled.push('the consumer app has no pf-slideout-menu');
    } else if (slideoutDialog.open) {
      result.unstyled.push('pf-slideout-menu started open — the fixture is wrong');
    }

    /* The toaster is a fixed, corner-anchored column. */
    const toaster = document.querySelector('pf-toaster');
    const stack = toaster?.shadowRoot?.querySelector('[part="stack"]');
    if (!stack) {
      result.unstyled.push('the consumer app has no pf-toaster');
    } else {
      const style = getComputedStyle(stack);
      if (style.position !== 'fixed') {
        result.unstyled.push(`pf-toaster stack is position "${style.position}", expected fixed`);
      }
      if (style.display !== 'grid') {
        result.unstyled.push(`pf-toaster stack is display "${style.display}", expected grid`);
      }
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

  if (report.radioClickedValue) {
    const settled = await page
      .waitForFunction(
        (want) => {
          const radios = [...document.querySelectorAll('pf-radio-group pf-radio-button')];
          const checked = radios.filter((r) => r.shadowRoot?.querySelector('input')?.checked);
          return checked.length === 1 && checked[0].value === want
            ? { checked: checked.length }
            : null;
        },
        report.radioClickedValue,
        { timeout: 5_000 },
      )
      .then((handle) => handle.jsonValue())
      .catch(() => null);

    if (!settled) {
      const state = await page.evaluate(() =>
        [...document.querySelectorAll('pf-radio-group pf-radio-button')]
          .filter((r) => r.shadowRoot?.querySelector('input')?.checked)
          .map((r) => r.value),
      );
      problems.push(
        `pf-radio-group: after clicking "${report.radioClickedValue}" the checked radios are ` +
          `[${state.join(', ')}] (was "${report.radioBefore}") — expected exactly that one`,
      );
    }
  }

  if (report.modalClicked) {
    const opened = await page
      .waitForFunction(
        () => {
          const dialog = document.querySelector('pf-modal')?.shadowRoot?.querySelector('dialog');
          const panel = dialog?.querySelector('[part="panel"]');
          return dialog?.open && document.documentElement.style.overflow === 'hidden'
            ? {
                backdrop: getComputedStyle(dialog, '::backdrop').backgroundColor,
                focusInside: Boolean(document.querySelector('pf-modal')?.shadowRoot?.activeElement),
                animations: panel ? panel.getAnimations().length : 0,
                animationName: panel ? getComputedStyle(panel).animationName : 'no panel',
                animationDuration: panel ? getComputedStyle(panel).animationDuration : '0s',
              }
            : null;
        },
        undefined,
        { timeout: 5_000 },
      )
      .then((handle) => handle.jsonValue())
      .catch(() => null);

    if (!opened) {
      const state = await page.evaluate(() => ({
        open: document.querySelector('pf-modal')?.shadowRoot?.querySelector('dialog')?.open,
        overflow: document.documentElement.style.overflow,
      }));
      problems.push(
        `pf-modal: after clicking open, dialog.open is ${state.open} and ` +
          `documentElement overflow is "${state.overflow}" — expected true and "hidden"`,
      );
    } else {
      if (!opened.backdrop || opened.backdrop === 'rgba(0, 0, 0, 0)') {
        problems.push(`pf-modal ::backdrop has no background ("${opened.backdrop}")`);
      }
      if (!opened.focusInside) {
        problems.push('pf-modal did not move focus into the dialog');
      }
      /*
       * The regression guard for a bug this check was written after: the panel
       * animated with `var(--duration-medium)`, a token that does not exist,
       * which makes the whole `animation` shorthand invalid at computed-value
       * time — `animation-name` computes to `none` and nothing ever ran.
       * Nothing noticed, because no test asserted the animation.
       */
      if (opened.animations === 0) {
        problems.push(
          'pf-modal panel runs no animation ' +
            `(animation-name "${opened.animationName}", duration ` +
            `"${opened.animationDuration}") — a @keyframes copy or a motion ` +
            'token is missing',
        );
      }

      // Closing has to give the page its scroll back.
      await page.evaluate(() => {
        const cancel = [...document.querySelectorAll('pf-modal pf-button')].find(
          (b) => b.textContent?.trim() === 'Cancel',
        );
        cancel?.shadowRoot?.querySelector('button')?.click();
      });
      const released = await page
        .waitForFunction(
          (before) => {
            const dialog = document.querySelector('pf-modal')?.shadowRoot?.querySelector('dialog');
            return !dialog?.open && document.documentElement.style.overflow === before;
          },
          report.modalBefore ?? '',
          { timeout: 5_000 },
        )
        .catch(() => null);

      if (!released) {
        const overflow = await page.evaluate(() => document.documentElement.style.overflow);
        problems.push(
          `pf-modal left the page scroll locked after closing (overflow "${overflow}")`,
        );
      }
    }
  }

  /*
   * The slideout, opened through the host app's own state: pinned to the edge
   * its `placement` names, animating, scroll-locked, and giving the scroll back.
   * Every one of these is a claim packages/elements cannot make — no component
   * CSS is applied in either Vitest project.
   */
  {
    const clicked = await page.evaluate(() => {
      const opener = [...document.querySelectorAll('pf-button')].find(
        (b) => b.textContent?.trim() === 'Open slideout',
      );
      opener?.shadowRoot?.querySelector('button')?.click();
      return Boolean(opener);
    });

    if (!clicked) problems.push('the consumer app has no "Open slideout" button');

    const opened = await page
      .waitForFunction(
        () => {
          const el = document.querySelector('pf-slideout-menu');
          const dialog = el?.shadowRoot?.querySelector('dialog');
          const panel = el?.shadowRoot?.querySelector('[part="panel"]');
          if (!dialog?.open || !panel) return null;
          const box = panel.getBoundingClientRect();
          return {
            right: Math.round(box.right),
            left: Math.round(box.left),
            width: Math.round(box.width),
            viewport: window.innerWidth,
            animations: panel.getAnimations().length,
            animationName: getComputedStyle(panel).animationName,
            animationDuration: getComputedStyle(panel).animationDuration,
            overflow: document.documentElement.style.overflow,
            labelledby: dialog.getAttribute('aria-labelledby'),
            named: Boolean(el.shadowRoot?.getElementById('title')?.textContent?.trim()),
          };
        },
        undefined,
        { timeout: 5_000 },
      )
      .then((handle) => handle.jsonValue())
      .catch(() => null);

    if (!opened && clicked) {
      problems.push('pf-slideout-menu did not open after clicking its button');
    } else if (opened) {
      // placement="right": the panel's right edge is the viewport's right edge.
      if (opened.right !== opened.viewport) {
        problems.push(
          `pf-slideout-menu panel right edge is ${opened.right}, expected the ` +
            `viewport's ${opened.viewport} — it is not pinned to the right`,
        );
      }
      if (opened.width <= 0 || opened.width >= opened.viewport) {
        problems.push(`pf-slideout-menu panel width is ${opened.width}, expected a partial width`);
      }
      /*
       * A missing @keyframes copy reports a perfectly good `animationName` and
       * runs nothing, and an undefined motion token makes the whole shorthand
       * invalid at computed-value time, which computes `animationName` to
       * `none`. getAnimations() is the only check that sees both, so the
       * computed values are reported alongside it rather than asserted.
       */
      if (opened.animations === 0) {
        problems.push(
          'pf-slideout-menu panel runs no animation ' +
            `(animation-name "${opened.animationName}", duration ` +
            `"${opened.animationDuration}") — a @keyframes copy or a motion ` +
            'token is missing',
        );
      }
      if (opened.overflow !== 'hidden') {
        problems.push(`pf-slideout-menu did not lock page scroll (overflow "${opened.overflow}")`);
      }
      if (opened.labelledby !== 'title' || !opened.named) {
        problems.push('pf-slideout-menu does not name itself from its heading');
      }

      await page.evaluate(() => {
        const cancel = [...document.querySelectorAll('pf-slideout-menu pf-button')].find(
          (b) => b.textContent?.trim() === 'Cancel',
        );
        cancel?.shadowRoot?.querySelector('button')?.click();
      });

      const released = await page
        .waitForFunction(
          () => {
            const dialog = document
              .querySelector('pf-slideout-menu')
              ?.shadowRoot?.querySelector('dialog');
            return !dialog?.open && document.documentElement.style.overflow === '';
          },
          undefined,
          { timeout: 5_000 },
        )
        .catch(() => null);

      if (!released) {
        const state = await page.evaluate(() => document.documentElement.style.overflow);
        problems.push(`pf-slideout-menu left the page scroll locked after closing ("${state}")`);
      }
    }
  }

  /*
   * A toast round trip through the imperative API the region exposes, which is
   * the whole point of pf-toaster: the method is called the way a consumer calls
   * it, and the notification has to appear, be announced at the right level,
   * and then leave.
   */
  {
    const toasted = await page
      .evaluate(async () => {
        const toaster = document.querySelector('pf-toaster');
        if (!toaster || typeof toaster.toast !== 'function') return null;
        const id = await toaster.toast({
          variant: 'danger',
          heading: 'Smoke',
          description: 'From the imperative API.',
          duration: 0,
        });
        return typeof id === 'string' && id.length > 0 ? id : null;
      })
      .catch((error) => ({ error: String(error) }));

    if (!toasted || toasted.error) {
      problems.push(`pf-toaster.toast() did not return an id (${toasted?.error ?? 'no id'})`);
    } else {
      const shown = await page
        .waitForFunction(
          () => {
            const toast = document
              .querySelector('pf-toaster')
              ?.shadowRoot?.querySelector('pf-notification');
            const box = toast?.shadowRoot?.querySelector('[part="notification"]');
            if (!box) return null;
            const style = getComputedStyle(box);
            return {
              role: box.getAttribute('role'),
              heading: box.querySelector('[part="title"]')?.textContent,
              background: style.backgroundColor,
              animations: box.getAnimations().length,
            };
          },
          undefined,
          { timeout: 5_000 },
        )
        .then((handle) => handle.jsonValue())
        .catch(() => null);

      if (!shown) {
        problems.push('pf-toaster.toast() returned an id but rendered no notification');
      } else {
        // danger is assertive: core's liveRegionRole, reaching the real DOM.
        if (shown.role !== 'alert') {
          problems.push(`a danger toast announces as "${shown.role}", expected alert`);
        }
        if (shown.heading !== 'Smoke') {
          problems.push(`the toast heading is "${shown.heading}", expected "Smoke"`);
        }
        if (shown.background === 'rgba(0, 0, 0, 0)') {
          problems.push('the toast has no background — the color-mix chain broke');
        }
        if (shown.animations === 0) {
          problems.push('the toast runs no entrance animation');
        }

        await page.evaluate((id) => document.querySelector('pf-toaster')?.dismiss(id), toasted);

        const gone = await page
          .waitForFunction(
            () =>
              !document.querySelector('pf-toaster')?.shadowRoot?.querySelector('pf-notification'),
            undefined,
            { timeout: 5_000 },
          )
          .catch(() => null);

        if (!gone) problems.push('pf-toaster.dismiss() left the notification in the stack');
      }
    }
  }

  /*
   * The command palette, driven the way a user drives it. Three of these are
   * claims packages/elements cannot make, because neither Vitest project applies
   * `styleUrl` CSS: that a filtered-out item is actually *hidden* (the `hidden`
   * attribute alone loses to the host's own `display: flex`, which is why
   * `:host([hidden])` exists), that the active option's background resolves
   * through the alias chain, and that the panel animates.
   */
  {
    const clicked = await page.evaluate(() => {
      const opener = [...document.querySelectorAll('pf-button')].find(
        (b) => b.textContent?.trim() === 'Open command palette',
      );
      opener?.shadowRoot?.querySelector('button')?.click();
      return Boolean(opener);
    });

    if (!clicked) {
      problems.push('the consumer app has no "Open command palette" button');
    } else {
      const opened = await page
        .waitForFunction(
          () => {
            const el = document.querySelector('pf-command-palette');
            const dialog = el?.shadowRoot?.querySelector('dialog');
            const panel = el?.shadowRoot?.querySelector('[part="panel"]');
            if (!dialog?.open || !panel) return null;
            const style = getComputedStyle(panel);
            return {
              background: style.backgroundColor,
              animations: panel.getAnimations().length,
              animationName: style.animationName,
              animationDuration: style.animationDuration,
              overflow: document.documentElement.style.overflow,
              focused: el.shadowRoot?.activeElement?.tagName,
              groupLabel: el
                .querySelector('pf-command-group')
                ?.shadowRoot?.querySelector('[part="label"]')?.textContent,
            };
          },
          undefined,
          { timeout: 5_000 },
        )
        .then((handle) => handle.jsonValue())
        .catch(() => null);

      if (!opened) {
        problems.push('pf-command-palette did not open after clicking its button');
      } else {
        if (isTransparent(opened.background)) {
          problems.push('pf-command-palette panel has no background');
        }
        if (opened.animations === 0) {
          problems.push(
            'pf-command-palette panel runs no animation ' +
              `(animation-name "${opened.animationName}", duration ` +
              `"${opened.animationDuration}")`,
          );
        }
        if (opened.overflow !== 'hidden') {
          problems.push(`pf-command-palette did not lock page scroll ("${opened.overflow}")`);
        }
        if (opened.focused !== 'INPUT') {
          problems.push(`pf-command-palette focused "${opened.focused}", expected its input`);
        }
        if (opened.groupLabel !== 'File') {
          problems.push(`the first command group is labelled "${opened.groupLabel}"`);
        }

        // Type a query, then read what the stylesheet actually did with it.
        const filtered = await page
          .evaluate(async () => {
            const el = document.querySelector('pf-command-palette');
            const input = el.shadowRoot.querySelector('input');
            input.value = 'settings';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const read = (value) => {
              const item = el.querySelector(`pf-command-item[value="${value}"]`);
              const style = getComputedStyle(item);
              return {
                hidden: item.hasAttribute('hidden'),
                display: style.display,
                background: style.backgroundColor,
                selected: item.getAttribute('aria-selected'),
                labelColour: getComputedStyle(item.shadowRoot.querySelector('[part="label"]'))
                  .color,
              };
            };

            return {
              match: read('settings'),
              excluded: read('new'),
              emptyGroupDisplay: getComputedStyle(el.querySelector('pf-command-group')).display,
              activeIsElement:
                input.ariaActiveDescendantElement ===
                el.querySelector('pf-command-item[value="settings"]'),
            };
          })
          .catch((error) => ({ error: String(error) }));

        if (filtered.error) {
          problems.push(`pf-command-palette filtering threw: ${filtered.error}`);
        } else {
          // The attribute is set, and the stylesheet is what makes it count.
          if (!filtered.excluded.hidden) {
            problems.push('pf-command-palette did not mark a non-matching command hidden');
          }
          if (filtered.excluded.display !== 'none') {
            problems.push(
              `a filtered-out pf-command-item computes display "${filtered.excluded.display}" ` +
                '— :host([hidden]) is missing, and `hidden` alone loses to `display: flex`',
            );
          }
          if (filtered.emptyGroupDisplay !== 'none') {
            problems.push(
              `a pf-command-group with no matches computes display ` +
                `"${filtered.emptyGroupDisplay}", expected none`,
            );
          }
          if (filtered.match.display === 'none') {
            problems.push('pf-command-palette hid the command that matched');
          }
          if (filtered.match.selected !== 'true') {
            problems.push('pf-command-palette did not make the only match the active option');
          }
          if (isTransparent(filtered.match.background)) {
            problems.push(
              'the active pf-command-item has no background — ' +
                '--pf-command-item-active-bg did not resolve',
            );
          }
          // The active background is the primary action colour, so the label has
          // to switch to its matching foreground or it is unreadable.
          if (filtered.match.labelColour === filtered.excluded.labelColour) {
            problems.push(
              `the active command's label is the same colour as an inactive one ` +
                `("${filtered.match.labelColour}") — --pf-command-item-active-text did not apply`,
            );
          }
          if (!filtered.activeIsElement) {
            problems.push('the search input does not point at the active option as an element');
          }
        }

        // Enter runs it, which closes the palette and gives the scroll back.
        await page.evaluate(() => {
          const el = document.querySelector('pf-command-palette');
          el.shadowRoot
            .querySelector('input')
            .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        });

        const ran = await page
          .waitForFunction(
            () => {
              const el = document.querySelector('pf-command-palette');
              const dialog = el?.shadowRoot?.querySelector('dialog');
              const output = document.querySelector('[data-testid="command-choice"]');
              return !dialog?.open &&
                document.documentElement.style.overflow === '' &&
                output?.textContent?.trim() === 'settings'
                ? true
                : null;
            },
            undefined,
            { timeout: 5_000 },
          )
          .catch(() => null);

        if (!ran) {
          const state = await page.evaluate(() => ({
            open: document.querySelector('pf-command-palette')?.shadowRoot?.querySelector('dialog')
              ?.open,
            overflow: document.documentElement.style.overflow,
            output: document.querySelector('[data-testid="command-choice"]')?.textContent?.trim(),
          }));
          problems.push(
            `pf-command-palette Enter did not run the command: open ${state.open}, ` +
              `overflow "${state.overflow}", output "${state.output}"`,
          );
        }
      }
    }
  }

  /*
   * The calendar, keyboard first. The grid pattern is the thing the React
   * component does not have, and the three claims here need a real build: the
   * selected day's background and contrasting text come through the alias
   * chain, the single tab stop has to survive a move, and today's cell has to
   * be distinguishable from a plain one.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-calendar');
        if (!el) return { error: 'no pf-calendar in the consumer app' };

        const grid = el.shadowRoot.querySelector('[part="grid"]');
        const day = (iso) => el.shadowRoot.querySelector(`button[data-day="${iso}"]`);
        const stops = () =>
          [...el.shadowRoot.querySelectorAll('button[data-day][tabindex="0"]')].map((b) =>
            b.getAttribute('data-day'),
          );

        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const pressKey = async (key) => {
          grid.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          await frame();
          await frame();
        };

        const before = stops();
        await pressKey('ArrowRight');
        const after = stops();

        const selected = el.shadowRoot.querySelector('.day--selected');
        const plain = day('2024-03-13');
        const disabled = day('2024-03-01');

        return {
          tabStopsBefore: before,
          tabStopsAfter: after,
          focusFollowed: el.shadowRoot.activeElement?.getAttribute('data-day'),
          selected: selected
            ? {
                background: getComputedStyle(selected).backgroundColor,
                colour: getComputedStyle(selected).color,
              }
            : null,
          plainColour: plain ? getComputedStyle(plain).color : null,
          plainBackground: plain ? getComputedStyle(plain).backgroundColor : null,
          disabledOpacity: disabled ? getComputedStyle(disabled).opacity : null,
          weekdayCount: el.shadowRoot.querySelectorAll('[role="columnheader"]').length,
          gridColumns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          rowDisplay: getComputedStyle(el.shadowRoot.querySelector('.row')).display,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-calendar: ${state.error}`);
    } else {
      if (state.tabStopsBefore.length !== 1 || state.tabStopsAfter.length !== 1) {
        problems.push(
          `pf-calendar has ${state.tabStopsBefore.length} tab stops before a move and ` +
            `${state.tabStopsAfter.length} after, expected exactly 1 each — ` +
            'the whole grid should be one tab stop',
        );
      }
      if (state.tabStopsAfter[0] === state.tabStopsBefore[0]) {
        problems.push('pf-calendar did not move its tab stop on ArrowRight');
      }
      if (state.focusFollowed !== state.tabStopsAfter[0]) {
        problems.push(
          `pf-calendar moved its tab stop to ${state.tabStopsAfter[0]} but focus is on ` +
            `${state.focusFollowed} — the keyboard would stop responding`,
        );
      }

      // Seven columns, and the rows must not form boxes of their own or the
      // cells would not line up under the weekday headers.
      if (state.weekdayCount !== 7) {
        problems.push(`pf-calendar has ${state.weekdayCount} weekday headers, expected 7`);
      }
      if (state.gridColumns !== 7) {
        problems.push(`pf-calendar grid computes ${state.gridColumns} columns, expected 7`);
      }
      if (state.rowDisplay !== 'contents') {
        problems.push(
          `pf-calendar rows compute display "${state.rowDisplay}", expected contents — ` +
            'a row that forms its own box breaks the seven-column alignment',
        );
      }

      if (!state.selected) {
        problems.push('pf-calendar renders no selected day');
      } else {
        if (isTransparent(state.selected.background)) {
          problems.push(
            'the selected day has no background — --pf-calendar-selected-bg did not resolve',
          );
        }
        if (state.selected.colour === state.plainColour) {
          problems.push(
            `the selected day's text is the same colour as a plain one ` +
              `("${state.selected.colour}") — --pf-calendar-selected-text did not apply`,
          );
        }
      }

      // min/max blocks the start of the month in the fixture.
      if (state.disabledOpacity && Number(state.disabledOpacity) >= 1) {
        problems.push(
          `a day outside min/max computes opacity ${state.disabledOpacity}, ` +
            'expected it to be dimmed',
        );
      }
    }
  }

  /*
   * The date picker's panel, against a real build: anchored to its trigger
   * rather than centred (the UA stylesheet centres a popover, so this is the
   * `placePopover` claim where it matters), and styled.
   *
   * Its form association is already covered — `due` is in the submitted key set
   * above, which is the assertion that caught an unreflected `name` on the
   * other controls.
   */
  {
    const anchored = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-date-picker');
        if (!el) return { error: 'no pf-date-picker in the consumer app' };

        const trigger = el.shadowRoot.querySelector('[part="trigger"]');
        const panel = el.shadowRoot.querySelector('[part="panel"]');
        trigger.click();

        const deadline = Date.now() + 2000;
        while (!panel.matches(':popover-open')) {
          if (Date.now() > deadline) return { error: 'the panel never opened' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const triggerBox = trigger.getBoundingClientRect();
        const panelBox = panel.getBoundingClientRect();
        const calendar = el.shadowRoot.querySelector('pf-calendar');

        return {
          triggerLeft: Math.round(triggerBox.left),
          panelLeft: Math.round(panelBox.left),
          panelTop: Math.round(panelBox.top),
          triggerBottom: Math.round(triggerBox.bottom),
          viewportWidth: window.innerWidth,
          calendarBackground: getComputedStyle(
            calendar.shadowRoot.querySelector('[part="calendar"]'),
          ).backgroundColor,
          focusedDay: calendar.shadowRoot.activeElement?.getAttribute('data-day'),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (anchored.error) {
      problems.push(`pf-date-picker: ${anchored.error}`);
    } else {
      // Aligned with the trigger, not centred in the viewport.
      if (Math.abs(anchored.panelLeft - anchored.triggerLeft) > 2) {
        problems.push(
          `pf-date-picker panel is at x=${anchored.panelLeft} but its trigger is at ` +
            `x=${anchored.triggerLeft} — it is not anchored (a popover is centred ` +
            'until `inset: auto; margin: 0` opt out of it)',
        );
      }
      if (anchored.panelTop < anchored.triggerBottom - 2) {
        problems.push(
          `pf-date-picker panel opens at y=${anchored.panelTop}, above its trigger's ` +
            `bottom edge at ${anchored.triggerBottom}`,
        );
      }
      if (isTransparent(anchored.calendarBackground)) {
        problems.push('the calendar inside pf-date-picker has no background');
      }
      // The grid takes focus, which is what makes the keyboard usable at all.
      if (!anchored.focusedDay) {
        problems.push('pf-date-picker did not move focus into the calendar grid');
      }

      await page.evaluate(() => document.querySelector('pf-date-picker')?.hide());
    }
  }

  /*
   * The select, against a real build. Three of these need one: that a disabled
   * option is actually dimmed and the active one actually highlighted (the
   * `--pf-select-option-active-*` chain), that the listbox is anchored to its
   * trigger rather than centred, and that it matches the trigger's width — the
   * one piece of `observeAnchoredPosition` no other element here exercises.
   *
   * Its form association is covered above: `fruit` is in the submitted key set.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-select');
        if (!el) return { error: 'no pf-select in the consumer app' };

        const trigger = el.shadowRoot.querySelector('[part="trigger"]');
        const listbox = el.shadowRoot.querySelector('[part="listbox"]');
        trigger.click();

        const deadline = Date.now() + 2000;
        while (!listbox.matches(':popover-open')) {
          if (Date.now() > deadline) return { error: 'the listbox never opened' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const option = (value) => el.querySelector(`pf-option[value="${value}"]`);
        const active = el.querySelector('pf-option[active]');
        const triggerBox = trigger.getBoundingClientRect();
        const listBox = listbox.getBoundingClientRect();

        return {
          triggerLeft: Math.round(triggerBox.left),
          listLeft: Math.round(listBox.left),
          triggerWidth: Math.round(triggerBox.width),
          listWidth: Math.round(listBox.width),
          activeValue: active?.getAttribute('value') ?? null,
          activeBackground: active ? getComputedStyle(active).backgroundColor : null,
          plainBackground: getComputedStyle(option('cherry')).backgroundColor,
          disabledOpacityColour: getComputedStyle(option('blackberry')).color,
          plainColour: getComputedStyle(option('cherry')).color,
          // The label is a slot, so it can hold markup an options array cannot.
          markupInLabel: Boolean(option('banana').querySelector('small')),
          triggerText: trigger.textContent?.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-select: ${state.error}`);
    } else {
      // Anchored, not centred, and as wide as the trigger.
      if (Math.abs(state.listLeft - state.triggerLeft) > 2) {
        problems.push(
          `pf-select listbox is at x=${state.listLeft} but its trigger is at ` +
            `x=${state.triggerLeft} — it is not anchored`,
        );
      }
      if (Math.abs(state.listWidth - state.triggerWidth) > 2) {
        problems.push(
          `pf-select listbox is ${state.listWidth}px wide and its trigger ` +
            `${state.triggerWidth}px — matchAnchorWidth did not take effect`,
        );
      }

      // Opens on the chosen option, which is `banana` in the fixture.
      if (state.activeValue !== 'banana') {
        problems.push(
          `pf-select opened with "${state.activeValue}" active, expected the chosen banana`,
        );
      }
      if (isTransparent(state.activeBackground)) {
        problems.push(
          'the active pf-option has no background — --pf-select-option-active-bg did not resolve',
        );
      }
      if (state.activeBackground === state.plainBackground) {
        problems.push(
          `the active pf-option looks the same as a plain one ("${state.activeBackground}")`,
        );
      }
      if (state.disabledOpacityColour === state.plainColour) {
        problems.push(
          `a disabled pf-option is the same colour as a selectable one ` +
            `("${state.plainColour}")`,
        );
      }

      if (!state.markupInLabel) {
        problems.push('the pf-option fixture has no markup in a label — §2.1 is not demonstrated');
      }
      if (!state.triggerText?.includes('Banana')) {
        problems.push(`pf-select trigger shows "${state.triggerText}", expected the chosen label`);
      }

      await page.evaluate(() => document.querySelector('pf-select')?.hide());
    }
  }

  /*
   * The combobox, and specifically the --pf-option-* bridge: the same pf-option
   * element is slotted into pf-select and into pf-combobox, and each maps the
   * generic set to its own alias family. Only a real stylesheet resolves that —
   * neither Vitest project applies component CSS — and the failure mode is an
   * option with no colour at all, or two listboxes that look identical when the
   * two React families do not.
   */
  {
    const state = await page
      .evaluate(async () => {
        const combobox = document.querySelector('pf-combobox');
        const select = document.querySelector('pf-select');
        if (!combobox || !select) return { error: 'the consumer app is missing one of them' };

        const openIt = async (host, triggerPart) => {
          const panel = host.shadowRoot.querySelector('[part="listbox"]');
          host.shadowRoot.querySelector(triggerPart).click();
          const deadline = Date.now() + 2000;
          while (!panel.matches(':popover-open')) {
            if (Date.now() > deadline) return null;
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return panel;
        };

        if (!(await openIt(combobox, '[part="input"]')))
          return { error: 'the combobox never opened' };
        const comboActive = combobox.querySelector('pf-option[active]');
        const comboRead = comboActive && {
          background: getComputedStyle(comboActive).backgroundColor,
          colour: getComputedStyle(comboActive).color,
        };
        const comboDisabled = getComputedStyle(
          combobox.querySelector('pf-option[value="coventry"]'),
        ).color;
        const comboPlain = getComputedStyle(
          combobox.querySelector('pf-option[value="cardiff"]'),
        ).color;
        combobox.hide();

        if (!(await openIt(select, '[part="trigger"]')))
          return { error: 'the select never opened' };
        const selectActive = document.querySelector('pf-select pf-option[active]');
        const selectRead = selectActive && {
          background: getComputedStyle(selectActive).backgroundColor,
          colour: getComputedStyle(selectActive).color,
        };
        select.hide();

        return { comboRead, comboDisabled, comboPlain, selectRead };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-combobox: ${state.error}`);
    } else {
      for (const [which, read] of [
        ['pf-combobox', state.comboRead],
        ['pf-select', state.selectRead],
      ]) {
        if (!read) {
          problems.push(`${which} rendered no active pf-option`);
          continue;
        }
        if (isTransparent(read.background)) {
          problems.push(
            `the active pf-option inside ${which} has no background — ` +
              'the --pf-option-* bridge did not resolve',
          );
        }
        if (isTransparent(read.colour)) {
          problems.push(`the active pf-option inside ${which} has no text colour`);
        }
      }

      /*
       * An unresolved `var()` on `color` computes to the *initial* value —
       * measured as `rgb(0, 0, 0)` — not to the inherited one, which is the
       * fingerprint to look for. Comparing the disabled colour with a plain
       * one instead was vacuous: they differ either way, so it passed with the
       * mapping deleted. This palette's text is `rgb(15, 23, 42)` and nothing
       * in it is pure black, so black here means a mapping is missing.
       */
      for (const [which, colour] of [
        ['a disabled pf-option', state.comboDisabled],
        ['a selectable pf-option', state.comboPlain],
      ]) {
        if (colour === 'rgb(0, 0, 0)') {
          problems.push(
            `${which} computes colour ${colour}, the initial value — ` +
              'a --pf-option-* mapping did not resolve',
          );
        }
      }
      if (state.comboDisabled === state.comboPlain) {
        problems.push(
          `a disabled pf-option is the same colour as a selectable one ` +
            `("${state.comboPlain}")`,
        );
      }
    }
  }

  /*
   * The tab set, and specifically where the indicator lands. The strip is
   * `position: relative` and the indicator `position: absolute` only once the
   * real stylesheet is applied, so neither Vitest project can see the painted
   * box at all — there the assertion is on the coordinates written onto it.
   *
   * Also the measurement the element is built around: `offsetLeft` on a
   * slotted tab is resolved against an offsetParent in the *document* tree,
   * so it reports a different number from the tab's offset within the strip.
   * The gap is what an offsetLeft-based implementation would be out by.
   */
  {
    const state = await page
      .evaluate(async () => {
        const tabs = document.querySelector('pf-tabs');
        if (!tabs) return { error: 'the consumer app has no pf-tabs' };

        const strip = tabs.shadowRoot.querySelector('[part="list"]');
        const indicator = tabs.shadowRoot.querySelector('[part="indicator"]');
        const tabFor = (value) => tabs.querySelector(`pf-tab[value="${value}"]`);
        const panelFor = (value) => tabs.querySelector(`pf-tab-panel[value="${value}"]`);

        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };

        await settle();
        const first = tabFor('overview').getBoundingClientRect();
        const indicatorBox = indicator.getBoundingClientRect();
        const stripBox = strip.getBoundingClientRect();

        const read = {
          stripPosition: getComputedStyle(strip).position,
          indicatorPosition: getComputedStyle(indicator).position,
          indicatorBackground: getComputedStyle(indicator).backgroundColor,
          // Where the indicator actually painted, against the selected tab.
          indicatorLeft: indicatorBox.left,
          indicatorWidth: indicatorBox.width,
          selectedLeft: first.left,
          selectedWidth: first.width,
          // The indicator sits inside the strip, under the tabs.
          indicatorBottom: indicatorBox.bottom,
          stripBottom: stripBox.bottom,
          // The two kinds of offset, for the same tab.
          offsetLeft: tabFor('overview').offsetLeft,
          stripOffset: first.left - stripBox.left + strip.scrollLeft,
          offsetParent: tabFor('overview').offsetParent?.tagName.toLowerCase() ?? null,
          // One panel on show, the rest removed from the layout.
          shownDisplay: getComputedStyle(panelFor('overview')).display,
          hiddenDisplay: getComputedStyle(panelFor('issues')).display,
          // The tabs render inside the strip, above the panel.
          tabsAbovePanel: first.bottom <= panelFor('overview').getBoundingClientRect().top,
          disabledOpacity: getComputedStyle(tabFor('archive')).opacity,
          plainOpacity: getComputedStyle(tabFor('issues')).opacity,
          countBackground: getComputedStyle(
            tabFor('issues').shadowRoot.querySelector('[part="count"]'),
          ).backgroundColor,
        };

        // Then move the selection, and watch the indicator follow.
        tabFor('issues').click();
        const deadline = Date.now() + 3000;
        while (tabFor('issues').getAttribute('aria-selected') !== 'true') {
          if (Date.now() > deadline) return { ...read, error: 'the second tab never selected' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        // The indicator slides, so wait for the transition rather than sample.
        await Promise.all(indicator.getAnimations().map((animation) => animation.finished));
        await settle();

        const second = tabFor('issues').getBoundingClientRect();
        return {
          ...read,
          echo: document.querySelector('[data-testid="tabs-value"]')?.textContent?.trim(),
          movedIndicatorLeft: indicator.getBoundingClientRect().left,
          movedSelectedLeft: second.left,
          movedIndicatorWidth: indicator.getBoundingClientRect().width,
          movedSelectedWidth: second.width,
          movedShownDisplay: getComputedStyle(panelFor('issues')).display,
          movedHiddenDisplay: getComputedStyle(panelFor('overview')).display,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-tabs: ${state.error}`);
    } else {
      if (state.stripPosition !== 'relative') {
        problems.push(
          `the pf-tabs strip computes position: ${state.stripPosition} — ` +
            'the indicator would be placed against something else',
        );
      }
      if (state.indicatorPosition !== 'absolute') {
        problems.push(`the pf-tabs indicator computes position: ${state.indicatorPosition}`);
      }
      if (isTransparent(state.indicatorBackground)) {
        problems.push('the pf-tabs indicator has no background — a --pf-tabs-* alias is missing');
      }
      for (const [label, box, tab] of [
        ['at rest', state, 'overview'],
        [
          'after moving',
          {
            indicatorLeft: state.movedIndicatorLeft,
            indicatorWidth: state.movedIndicatorWidth,
            selectedLeft: state.movedSelectedLeft,
            selectedWidth: state.movedSelectedWidth,
          },
          'issues',
        ],
      ]) {
        if (Math.abs(box.indicatorLeft - box.selectedLeft) > 1) {
          problems.push(
            `the pf-tabs indicator ${label} painted at ${box.indicatorLeft} ` +
              `while the ${tab} tab starts at ${box.selectedLeft}`,
          );
        }
        if (Math.abs(box.indicatorWidth - box.selectedWidth) > 1) {
          problems.push(
            `the pf-tabs indicator ${label} is ${box.indicatorWidth}px wide ` +
              `while the ${tab} tab is ${box.selectedWidth}px`,
          );
        }
      }
      if (state.indicatorBottom > state.stripBottom + 1) {
        problems.push('the pf-tabs indicator painted below the strip');
      }
      /*
       * The measurement the element is built around. If these two ever agree
       * the comparison has stopped meaning anything — most likely because the
       * app no longer has a positioned ancestor around the tab set — and the
       * offsetLeft trap would go unnoticed.
       */
      if (Math.abs(state.offsetLeft - state.stripOffset) < 1) {
        problems.push(
          `a slotted pf-tab reports offsetLeft ${state.offsetLeft}, the same as its ` +
            `offset within the strip (${state.stripOffset}) — this app no longer ` +
            'demonstrates why the indicator is placed from rects',
        );
      }
      if (state.offsetParent === 'pf-tabs' || state.offsetParent === null) {
        problems.push(`a slotted pf-tab reports offsetParent ${state.offsetParent}`);
      }
      if (state.shownDisplay === 'none') {
        problems.push('the shown pf-tab-panel computes display: none');
      }
      if (state.hiddenDisplay !== 'none') {
        problems.push(
          `a hidden pf-tab-panel computes display: ${state.hiddenDisplay} — ` +
            'every panel is on show at once',
        );
      }
      if (state.movedShownDisplay === 'none' || state.movedHiddenDisplay !== 'none') {
        problems.push('the shown pf-tab-panel did not change with the selection');
      }
      if (!state.tabsAbovePanel) {
        problems.push('the pf-tabs strip did not render above its panels');
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `a disabled pf-tab looks the same as a selectable one (opacity ${state.plainOpacity})`,
        );
      }
      if (isTransparent(state.countBackground)) {
        problems.push('the pf-tab count badge has no background');
      }
      if (state.echo !== 'issues') {
        problems.push(`pf-tabs reported "${state.echo}" to the host framework, expected "issues"`);
      }
    }
  }

  /*
   * The accordion, and specifically the two things only a real stylesheet
   * does: the 0fr → 1fr height animation, and the rule between sections.
   *
   * The animation is asserted with `getAnimations()` rather than a computed
   * `transition`, because a computed value reports whatever was declared
   * whether or not it resolves — `pf-modal` shipped an undefined duration
   * token, which computes the whole shorthand away, and its entrance animation
   * had never run. Here the same mistake would make every section snap open.
   */
  {
    const state = await page
      .evaluate(async () => {
        const accordion = document.querySelector('pf-accordion');
        if (!accordion) return { error: 'the consumer app has no pf-accordion' };

        const items = Array.from(accordion.querySelectorAll('pf-accordion-item'));
        const section = (value) => items.find((item) => item.getAttribute('value') === value);
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const height = (value) => part(section(value), 'content').getBoundingClientRect().height;

        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const read = {
          // `shipping` is open in both apps; `returns` is not.
          openHeight: height('shipping'),
          closedHeight: height('returns'),
          openChevron: getComputedStyle(part(section('shipping'), 'icon')).transform,
          closedChevron: getComputedStyle(part(section('returns'), 'icon')).transform,
          // `:host(:first-child)` drops the rule above the first section.
          firstBorder: getComputedStyle(section('shipping')).borderTopWidth,
          secondBorder: getComputedStyle(section('returns')).borderTopWidth,
          groupBorder: getComputedStyle(accordion).borderTopWidth,
          triggerText: getComputedStyle(part(section('shipping'), 'trigger')).color,
          disabledOpacity: getComputedStyle(part(section('warranty'), 'trigger')).opacity,
          plainOpacity: getComputedStyle(part(section('returns'), 'trigger')).opacity,
        };

        // Open the second section and watch the panel animate rather than jump.
        part(section('returns'), 'trigger').click();
        const panel = part(section('returns'), 'panel');
        const deadline = Date.now() + 3000;
        while (panel.getAnimations().length === 0) {
          if (Date.now() > deadline) {
            // Reported with the echo, so a dead animation does not also look
            // like the event never reaching the host framework.
            return {
              ...read,
              animated: [],
              openedHeight: height('returns'),
              echo: document.querySelector('[data-testid="accordion-value"]')?.textContent?.trim(),
            };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        const animated = panel.getAnimations().map((animation) => ({
          property: animation.transitionProperty ?? null,
          duration: animation.effect?.getTiming().duration ?? 0,
        }));
        await Promise.all(panel.getAnimations().map((animation) => animation.finished));
        await settle();

        return {
          ...read,
          animated,
          openedHeight: height('returns'),
          echo: document.querySelector('[data-testid="accordion-value"]')?.textContent?.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-accordion: ${state.error}`);
    } else {
      if (!(state.openHeight > 0)) {
        problems.push(`an open pf-accordion-item panel measured ${state.openHeight}px`);
      }
      if (state.closedHeight !== 0) {
        problems.push(
          `a closed pf-accordion-item panel measured ${state.closedHeight}px — ` +
            'the 0fr row is not collapsing',
        );
      }
      if (state.openChevron === state.closedChevron) {
        problems.push(
          `the chevron looks the same open and closed ("${state.openChevron}") — ` +
            'the [expanded] rotation did not apply',
        );
      }
      if (state.firstBorder !== '0px') {
        problems.push(
          `the first pf-accordion-item has a ${state.firstBorder} top border — ` +
            ':host(:first-child) did not match, so it doubles the group’s own',
        );
      }
      if (state.secondBorder === '0px') {
        problems.push('the second pf-accordion-item has no rule above it');
      }
      if (state.groupBorder === '0px') {
        problems.push('pf-accordion has no border — a --pf-accordion-* alias is missing');
      }
      if (isTransparent(state.triggerText)) {
        problems.push('a pf-accordion-item header has no text colour');
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `a disabled header looks the same as an enabled one (opacity ${state.plainOpacity})`,
        );
      }
      const rows = state.animated.filter(
        (animation) => animation.property === 'grid-template-rows' && animation.duration > 0,
      );
      if (rows.length === 0) {
        problems.push(
          'opening a pf-accordion-item ran no grid-template-rows animation — ' +
            `it snaps open (${JSON.stringify(state.animated)})`,
        );
      }
      if (!(state.openedHeight > 0)) {
        problems.push(`the opened panel measured ${state.openedHeight}px once settled`);
      }
      if (state.echo !== 'shipping,returns') {
        problems.push(
          `pf-accordion reported "${state.echo}" to the host framework, ` +
            'expected "shipping,returns"',
        );
      }
    }
  }

  /*
   * The collapsible, which shares its panel mechanics with an accordion
   * section but owns `open` itself. What a real stylesheet adds here is the
   * closed panel measuring zero and the rule above the content, and what only
   * a real build shows is Escape on the header reaching the host framework.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-collapsible');
        if (!el) return { error: 'the consumer app has no pf-collapsible' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        const waitFor = async (predicate) => {
          const deadline = Date.now() + 3000;
          while (!predicate()) {
            if (Date.now() > deadline) return false;
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return true;
        };

        await settle();
        const closedHeight = part('content').getBoundingClientRect().height;
        const closedChevron = getComputedStyle(part('icon')).transform;

        part('trigger').click();
        if (!(await waitFor(() => el.open))) return { error: 'the header did not open it' };
        /*
         * `open` flips synchronously on the click, but the attribute it
         * reflects — and so the transition the stylesheet starts — lands on
         * the next render. Sampling here instead of waiting reported no
         * animation at all.
         */
        const panel = part('panel');
        await waitFor(() => panel.getAnimations().length > 0);
        const animated = panel.getAnimations().map((animation) => ({
          property: animation.transitionProperty ?? null,
          duration: animation.effect?.getTiming().duration ?? 0,
        }));
        await Promise.all(panel.getAnimations().map((animation) => animation.finished));
        await settle();

        const read = {
          closedHeight,
          closedChevron,
          animated,
          openHeight: part('content').getBoundingClientRect().height,
          openChevron: getComputedStyle(part('icon')).transform,
          contentRule: getComputedStyle(part('inner')).borderTopWidth,
          border: getComputedStyle(el).borderTopWidth,
          echo: document.querySelector('[data-testid="collapsible-value"]')?.textContent?.trim(),
        };

        // Escape on the header, which is the one key this element claims.
        part('trigger').focus();
        part('trigger').dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
        );
        const closedAgain = await waitFor(() => !el.open);
        await settle();

        return {
          ...read,
          closedAgain,
          echoAfterEscape: document
            .querySelector('[data-testid="collapsible-value"]')
            ?.textContent?.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-collapsible: ${state.error}`);
    } else {
      if (state.closedHeight !== 0) {
        problems.push(
          `a closed pf-collapsible panel measured ${state.closedHeight}px — ` +
            'the 0fr row is not collapsing',
        );
      }
      if (!(state.openHeight > 0)) {
        problems.push(`an open pf-collapsible panel measured ${state.openHeight}px`);
      }
      if (state.openChevron === state.closedChevron) {
        problems.push(
          `the chevron looks the same open and closed ("${state.openChevron}") — ` +
            'the [open] rotation did not apply',
        );
      }
      if (state.contentRule === '0px') {
        problems.push('the pf-collapsible content has no rule above it');
      }
      if (state.border === '0px') {
        problems.push('pf-collapsible has no border — a --pf-collapsible-* alias is missing');
      }
      const rows = state.animated.filter(
        (animation) => animation.property === 'grid-template-rows' && animation.duration > 0,
      );
      if (rows.length === 0) {
        problems.push(
          'opening pf-collapsible ran no grid-template-rows animation — ' +
            `it snaps open (${JSON.stringify(state.animated)})`,
        );
      }
      if (state.echo !== 'open') {
        problems.push(`pf-collapsible reported "${state.echo}" to the host framework on opening`);
      }
      if (!state.closedAgain || state.echoAfterEscape !== 'closed') {
        problems.push(
          `Escape on the pf-collapsible header left it ` +
            `"${state.echoAfterEscape}" (closed: ${state.closedAgain})`,
        );
      }
    }
  }

  /*
   * The breadcrumb trail. Two claims only a real build makes: the crumbs are
   * laid out in a row by the `<ol>` inside the shadow root — which depends on
   * the slot generating no box of its own — and the separator the group pushes
   * down is drawn by every crumb but the last.
   */
  {
    const state = await page
      .evaluate(() => {
        const trail = document.querySelector('pf-breadcrumbs');
        if (!trail) return { error: 'the consumer app has no pf-breadcrumbs' };

        const crumbs = Array.from(trail.querySelectorAll('pf-breadcrumb'));
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const list = part(trail, 'list');
        const boxes = crumbs.map((crumb) => crumb.getBoundingClientRect());

        return {
          role: trail.getAttribute('role'),
          name: trail.getAttribute('aria-label'),
          slotDisplay: getComputedStyle(list.querySelector('slot')).display,
          // A row: every crumb shares a baseline and each starts right of the
          // one before it. A slot with a box of its own would stack them.
          inARow: boxes.every((box, index) => index === 0 || box.left > boxes[index - 1].left),
          sameLine: boxes.every((box) => Math.abs(box.top - boxes[0].top) < 2),
          separators: crumbs.map((crumb) => part(crumb, 'separator')?.textContent ?? null),
          currentPages: crumbs
            .filter((crumb) => part(crumb, 'link').getAttribute('aria-current') === 'page')
            .map((crumb) => crumb.textContent.trim()),
          currentColour: getComputedStyle(part(crumbs[2], 'link')).color,
          linkColour: getComputedStyle(part(crumbs[0], 'link')).color,
          separatorColour: getComputedStyle(part(crumbs[0], 'separator')).color,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-breadcrumbs: ${state.error}`);
    } else {
      if (state.role !== 'navigation' || state.name !== 'Site breadcrumb') {
        problems.push(
          `pf-breadcrumbs is a ${state.role} named "${state.name}", ` +
            'expected a navigation landmark with the consumer’s name',
        );
      }
      if (state.slotDisplay !== 'contents') {
        problems.push(
          `the pf-breadcrumbs slot computes display: ${state.slotDisplay} — ` +
            'the crumbs are items of a box inside the list rather than of the list',
        );
      }
      if (!state.inARow || !state.sameLine) {
        problems.push(
          `the crumbs did not lay out in a row (in order: ${state.inARow}, ` +
            `one line: ${state.sameLine})`,
        );
      }
      if (state.separators.join('|') !== '›|›|') {
        problems.push(
          `the crumb separators read ${JSON.stringify(state.separators)}, ` +
            'expected the pushed-down string after all but the last',
        );
      }
      if (state.currentPages.join(',') !== 'Shoes') {
        problems.push(
          `aria-current="page" is on ${JSON.stringify(state.currentPages)}, ` +
            'expected the last crumb alone',
        );
      }
      if (state.currentColour === state.linkColour) {
        problems.push(
          `the current crumb is the same colour as a link ("${state.linkColour}") — ` +
            'the [current-page] rule did not apply',
        );
      }
      for (const [which, colour] of [
        ['a crumb link', state.linkColour],
        ['a crumb separator', state.separatorColour],
      ]) {
        if (colour === 'rgb(0, 0, 0)') {
          problems.push(
            `${which} computes colour ${colour}, the initial value — ` +
              'a --pf-breadcrumbs-* alias did not resolve',
          );
        }
      }
    }
  }

  /*
   * The step indicator. The claim worth a real build is the ring around the
   * current step: the React component asked for `--focus-ring-shadow`, which
   * is defined nowhere, and an undefined custom property makes the declaration
   * invalid at computed-value time — measured in Chromium, it computes to
   * `none`, so the ring had never been drawn in either layer. The rest is the
   * layout: the steps are grid items of the host, and a step with no
   * description generates no box for one.
   */
  {
    const state = await page
      .evaluate(() => {
        const indicator = document.querySelector('pf-progress-steps');
        if (!indicator) return { error: 'the consumer app has no pf-progress-steps' };

        const steps = Array.from(indicator.querySelectorAll('pf-progress-step'));
        if (steps.length < 3) return { error: `only ${steps.length} steps in the fixture` };
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const boxes = steps.map((step) => step.getBoundingClientRect());
        const descriptionSlot = (step) => step.shadowRoot.querySelector('slot[name="description"]');

        return {
          states: steps.map((step) => step.getAttribute('state')),
          currentRing: getComputedStyle(part(steps[1], 'marker')).boxShadow,
          upcomingRing: getComputedStyle(part(steps[2], 'marker')).boxShadow,
          completeMarker: getComputedStyle(part(steps[0], 'marker')).backgroundColor,
          upcomingMarker: getComputedStyle(part(steps[2], 'marker')).backgroundColor,
          completeConnector: getComputedStyle(part(steps[0], 'connector')).backgroundColor,
          upcomingConnector: getComputedStyle(part(steps[1], 'connector')).backgroundColor,
          currentTitle: getComputedStyle(part(steps[1], 'title')).color,
          plainTitle: getComputedStyle(part(steps[0], 'title')).color,
          // A row of grid items: each starts right of the one before it.
          inARow: boxes.every((box, index) => index === 0 || box.left > boxes[index - 1].left),
          slotDisplay: getComputedStyle(indicator.shadowRoot.querySelector('slot')).display,
          // The description's box exists only where there is a description.
          withDescription: descriptionSlot(steps[1]).assignedElements().length,
          withoutDescription: descriptionSlot(steps[0]).getBoundingClientRect().height,
          /*
           * The *content* boxes, not the steps': the steps are grid items in
           * one row, so the grid stretches them to a common height and the
           * description makes no difference to it. Measured — 79.59px for both
           * — which made the first version of this check vacuous.
           */
          describedHeight: part(steps[1], 'content').getBoundingClientRect().height,
          plainHeight: part(steps[0], 'content').getBoundingClientRect().height,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-progress-steps: ${state.error}`);
    } else {
      if (state.states.join(',') !== 'complete,current,upcoming') {
        problems.push(
          `the steps resolved to ${JSON.stringify(state.states)}, ` +
            'expected complete, current, upcoming',
        );
      }
      if (state.currentRing === 'none') {
        problems.push(
          'the current step has no ring — an undefined custom property computes ' +
            'box-shadow away, which is what --focus-ring-shadow did',
        );
      }
      if (state.upcomingRing !== 'none') {
        problems.push(`an upcoming step has a ring ("${state.upcomingRing}")`);
      }
      if (state.completeMarker === state.upcomingMarker) {
        problems.push(
          `a complete marker is the same colour as an upcoming one ` +
            `("${state.upcomingMarker}")`,
        );
      }
      if (state.completeConnector === state.upcomingConnector) {
        problems.push(
          `a complete connector is the same colour as an upcoming one ` +
            `("${state.upcomingConnector}")`,
        );
      }
      if (state.currentTitle === state.plainTitle) {
        problems.push(`the current step's title is the same colour as the others`);
      }
      if (state.slotDisplay !== 'contents' || !state.inARow) {
        problems.push(
          `the steps did not lay out as a row of grid items ` +
            `(slot display ${state.slotDisplay}, in order: ${state.inARow})`,
        );
      }
      if (state.withDescription !== 1 || state.withoutDescription !== 0) {
        problems.push(
          `the description slot generated a box where there is no description ` +
            `(${state.withoutDescription}px)`,
        );
      }
      if (!(state.describedHeight > state.plainHeight)) {
        problems.push(
          `the step with a description is no taller than the one without ` +
            `(${state.describedHeight} vs ${state.plainHeight}) — ` +
            'the ::slotted description styling did not apply',
        );
      }
    }
  }

  /*
   * The timeline. Three claims that need a real stylesheet: the marker grows
   * for the entry that carries an icon (a class from JS, because `:has(*)` on
   * a wrapper around a slot always matches), the three tones are three
   * colours, and an entry with no timestamp or description takes no space for
   * them — which is why neither has a wrapper.
   */
  {
    const state = await page
      .evaluate(() => {
        const timeline = document.querySelector('pf-timeline');
        if (!timeline) return { error: 'the consumer app has no pf-timeline' };

        const entries = Array.from(timeline.querySelectorAll('pf-timeline-item'));
        if (entries.length < 3) return { error: `only ${entries.length} entries in the fixture` };
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const slot = (host, name) => host.shadowRoot.querySelector(`slot[name="${name}"]`);
        const marker = (index) => part(entries[index], 'marker').getBoundingClientRect();

        return {
          lasts: entries.map((entry) => entry.hasAttribute('last')),
          connectors: entries.map((entry) => Boolean(part(entry, 'connector'))),
          iconMarkerSize: marker(0).width,
          plainMarkerSize: marker(1).width,
          tones: entries.map((entry) => getComputedStyle(part(entry, 'marker')).borderTopColor),
          connectorColour: getComputedStyle(part(entries[0], 'connector')).backgroundColor,
          // The rail and the content are two columns of one grid.
          railRight: part(entries[0], 'rail').getBoundingClientRect().right,
          contentLeft: part(entries[0], 'content').getBoundingClientRect().left,
          // Space below every entry's content but the last.
          contentPadding: entries.map(
            (entry) => getComputedStyle(part(entry, 'content')).paddingBottom,
          ),
          // The slots with nothing in them take no space.
          emptyTimestamp: slot(entries[2], 'timestamp').getBoundingClientRect().height,
          filledTimestamp: slot(entries[1], 'timestamp')
            .assignedElements()[0]
            .getBoundingClientRect().height,
          slotDisplay: getComputedStyle(timeline.shadowRoot.querySelector('slot:not([name])'))
            .display,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-timeline: ${state.error}`);
    } else {
      if (state.lasts.join(',') !== 'false,false,true') {
        problems.push(`the timeline marked ${JSON.stringify(state.lasts)} as last`);
      }
      if (state.connectors.join(',') !== 'true,true,false') {
        problems.push(
          `the connectors read ${JSON.stringify(state.connectors)}, ` +
            'expected one after all but the last entry',
        );
      }
      if (!(state.iconMarkerSize > state.plainMarkerSize)) {
        problems.push(
          `the marker carrying an icon is ${state.iconMarkerSize}px against ` +
            `${state.plainMarkerSize}px for a plain one — it did not grow, so the ` +
            'icon is being asked for in CSS rather than in JS',
        );
      }
      if (new Set(state.tones).size !== 3) {
        problems.push(
          `the three tones produced ${JSON.stringify(state.tones)} — ` +
            'a --pf-timeline-* alias did not resolve',
        );
      }
      if (isTransparent(state.connectorColour)) {
        problems.push('the timeline connector has no colour');
      }
      if (!(state.contentLeft > state.railRight - 1)) {
        problems.push(
          `the content starts at ${state.contentLeft}, left of the rail's right ` +
            `edge at ${state.railRight} — the two columns are not laid out`,
        );
      }
      if (state.contentPadding[2] !== '0px' || state.contentPadding[0] === '0px') {
        problems.push(
          `the content padding reads ${JSON.stringify(state.contentPadding)}, ` +
            'expected space below all but the last entry',
        );
      }
      if (state.emptyTimestamp !== 0 || !(state.filledTimestamp > 0)) {
        problems.push(
          `an empty timestamp slot measured ${state.emptyTimestamp}px and a filled ` +
            `one ${state.filledTimestamp}px`,
        );
      }
      if (state.slotDisplay !== 'contents') {
        problems.push(`the pf-timeline slot computes display: ${state.slotDisplay}`);
      }
    }
  }

  /*
   * The rating. The claim that needs a real stylesheet is the half star: the
   * filled glyph is the same glyph clipped to a percentage width, so the
   * fourth star of a 3.5 rating has to measure half the width of a full one.
   * The inline `--pf-rating-fill` the unit tests read says nothing about
   * whether the clip resolves.
   */
  {
    const state = await page
      .evaluate(() => {
        const row = document.querySelector('pf-rating-stars');
        const badge = document.querySelector('pf-rating-badge');
        if (!row || !badge) return { error: 'the consumer app is missing one of them' };

        const stars = Array.from(row.shadowRoot.querySelectorAll('[part="star"]'));
        if (stars.length !== 5) return { error: `${stars.length} stars in the fixture` };
        const clip = (index) => stars[index].querySelector('.fill').getBoundingClientRect().width;
        const starWidth = stars[0].getBoundingClientRect().width;

        return {
          starWidth,
          fullClip: clip(2),
          halfClip: clip(3),
          emptyClip: clip(4),
          emptyColour: getComputedStyle(stars[0].querySelector('.base')).color,
          fillColour: getComputedStyle(stars[0].querySelector('.filled')).color,
          valueText: row.shadowRoot.querySelector('[part="value"]')?.textContent?.trim(),
          badgeBackground: getComputedStyle(badge).backgroundColor,
          badgeBorder: getComputedStyle(badge).borderTopWidth,
          badgeRadius: getComputedStyle(badge).borderTopLeftRadius,
          badgeText: badge.shadowRoot.querySelector('[part="value"]')?.textContent?.trim(),
          reviewsColour: getComputedStyle(badge.shadowRoot.querySelector('[part="reviews"]')).color,
          badgeTextColour: getComputedStyle(badge).color,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-rating-stars: ${state.error}`);
    } else {
      if (!(state.starWidth > 0)) {
        problems.push(`a star measured ${state.starWidth}px wide`);
      }
      if (Math.abs(state.fullClip - state.starWidth) > 1) {
        problems.push(`a full star's fill is ${state.fullClip}px of a ${state.starWidth}px star`);
      }
      if (Math.abs(state.halfClip - state.starWidth / 2) > 1) {
        problems.push(
          `the half star's fill is ${state.halfClip}px of a ${state.starWidth}px star, ` +
            'expected half — the percentage clip did not resolve',
        );
      }
      if (state.emptyClip !== 0) {
        problems.push(`an empty star's fill measured ${state.emptyClip}px`);
      }
      if (state.emptyColour === state.fillColour) {
        problems.push(
          `a filled star is the same colour as an empty one ("${state.fillColour}") — ` +
            'a --pf-rating-* alias did not resolve',
        );
      }
      if (state.valueText !== '3.5') {
        problems.push(`pf-rating-stars wrote "${state.valueText}", expected 3.5`);
      }
      if (isTransparent(state.badgeBackground) || state.badgeBorder === '0px') {
        problems.push(
          `pf-rating-badge has no pill (background "${state.badgeBackground}", ` +
            `border ${state.badgeBorder})`,
        );
      }
      if (parseFloat(state.badgeRadius) < 12) {
        problems.push(`pf-rating-badge is not a pill (radius ${state.badgeRadius})`);
      }
      if (state.badgeText !== '4.5/5.0') {
        problems.push(`pf-rating-badge wrote "${state.badgeText}", expected 4.5/5.0`);
      }
      if (state.reviewsColour === state.badgeTextColour) {
        problems.push('the review count is the same colour as the rating');
      }
    }
  }

  /*
   * The empty state. What needs a real stylesheet is the pair of boxes that
   * are hidden rather than left out: `display: none` has to come from the
   * `empty` class, and the box that does have content has to be laid out. The
   * description has no box at all, so it costs nothing when absent.
   */
  {
    const state = await page
      .evaluate(() => {
        const el = document.querySelector('pf-empty-state');
        if (!el) return { error: 'the consumer app has no pf-empty-state' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const slot = (name) => el.shadowRoot.querySelector(`slot[name="${name}"]`);

        return {
          iconDisplay: getComputedStyle(part('icon')).display,
          actionDisplay: getComputedStyle(part('action')).display,
          // The same element with nothing in those slots, so the `empty`
          // class has to beat each box's own `display`. The first version of
          // this check only looked at the filled boxes and so said nothing
          // about the rule that hides them.
          bareIconDisplay: getComputedStyle(
            document
              .querySelector('pf-metric-grid pf-metric-card:last-of-type')
              .shadowRoot.querySelector('[part="icon"]'),
          ).display,
          iconColour: getComputedStyle(part('icon')).color,
          iconSize: part('icon').getBoundingClientRect().width,
          headingWeight: getComputedStyle(part('heading')).fontWeight,
          headingColour: getComputedStyle(part('heading')).color,
          descriptionColour: getComputedStyle(slot('description').assignedElements()[0]).color,
          descriptionWidth: getComputedStyle(slot('description').assignedElements()[0]).maxWidth,
          centred: getComputedStyle(el).textAlign,
          padding: getComputedStyle(el).paddingTop,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-empty-state: ${state.error}`);
    } else {
      if (state.iconDisplay === 'none' || !(state.iconSize > 0)) {
        problems.push(
          `the pf-empty-state icon box is ${state.iconDisplay} at ${state.iconSize}px — ` +
            'the named icon did not draw',
        );
      }
      /*
       * `flex`, not the `inline-flex` the sheet asks for: the host is a flex
       * container, so an inline-level child is blockified. Measured — the
       * first version of this check asserted `inline-flex` and failed on a
       * perfectly good build.
       */
      if (!['flex', 'inline-flex'].includes(state.actionDisplay)) {
        problems.push(
          `the pf-empty-state action box computes display: ${state.actionDisplay}, ` +
            'expected the row that holds the button',
        );
      }
      for (const [which, colour] of [
        ['the icon', state.iconColour],
        ['the heading', state.headingColour],
        ['the description', state.descriptionColour],
      ]) {
        if (colour === 'rgb(0, 0, 0)') {
          problems.push(
            `${which} computes colour ${colour}, the initial value — ` +
              'a --pf-empty-state-* alias did not resolve',
          );
        }
      }
      if (state.headingColour === state.descriptionColour) {
        problems.push('the heading and the description are the same colour');
      }
      if (state.descriptionWidth === 'none') {
        problems.push(
          'the description has no measure — the ::slotted styling did not apply, ' +
            'which is the only styling it gets',
        );
      }
      if (state.bareIconDisplay !== 'none') {
        problems.push(
          `a box with an empty slot computes display: ${state.bareIconDisplay} — ` +
            'the `empty` class is tying with the box’s own display and losing on order',
        );
      }
      if (state.centred !== 'center' || state.padding === '0px') {
        problems.push(
          `pf-empty-state is ${state.centred} with ${state.padding} padding, ` +
            'expected centred and padded',
        );
      }
    }
  }

  /*
   * The four slot-shaped leaves, which share one arrangement: a box that
   * carries layout is hidden when its slot is empty, and a slot that carries
   * none has no box at all. Only a real stylesheet shows the difference —
   * `display: none` coming from the `empty` class, and the absent box costing
   * nothing in a gapped grid.
   */
  {
    const state = await page
      .evaluate(() => {
        const card = document.querySelector('pf-metric-card');
        const grid = document.querySelector('pf-metric-grid');
        const pageHeader = document.querySelector('pf-page-header');
        const sectionHeader = document.querySelector('pf-section-header');
        const sectionFooter = document.querySelector('pf-section-footer');
        if (!card || !grid || !pageHeader || !sectionHeader || !sectionFooter) {
          return { error: 'the consumer app is missing one of the leaves' };
        }

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const display = (host, name) => getComputedStyle(part(host, name)).display;
        const cards = Array.from(grid.querySelectorAll('pf-metric-card'));
        const cardBoxes = cards.map((node) => node.getBoundingClientRect());

        return {
          // The filled card draws every box; the bare one draws none of them.
          filledTrend: display(cards[0], 'trend'),
          filledAction: display(cards[0], 'action'),
          filledIcon: display(cards[0], 'icon'),
          bareTrend: display(cards[2], 'trend'),
          bareAction: display(cards[2], 'action'),
          bareIcon: display(cards[2], 'icon'),
          // The trend pill is coloured by direction.
          positivePill: getComputedStyle(part(cards[0], 'trend')).backgroundColor,
          negativePill: getComputedStyle(part(cards[1], 'trend')).backgroundColor,
          cardBackground: getComputedStyle(cards[0]).backgroundColor,
          cardBorder: getComputedStyle(cards[0]).borderTopWidth,
          // Cards in a row, laid out by the grid itself.
          cardsInARow: cardBoxes.every(
            (box, index) => index === 0 || box.left > cardBoxes[index - 1].left,
          ),
          gridSlotDisplay: getComputedStyle(grid.shadowRoot.querySelector('slot')).display,
          // The page header's title is the big one, and its trail is drawn.
          headingSize: parseFloat(getComputedStyle(part(pageHeader, 'heading')).fontSize),
          breadcrumbsDisplay: display(pageHeader, 'breadcrumbs'),
          pageActions: display(pageHeader, 'actions'),
          // The section header's rule, and the footer's on the other edge.
          sectionRule: getComputedStyle(sectionHeader).borderBottomWidth,
          footerRule: getComputedStyle(sectionFooter).borderTopWidth,
          sectionMetadata: display(sectionHeader, 'metadata'),
          footerHeading: display(sectionFooter, 'heading'),
          // An eyebrow is styled only through ::slotted(), so this is the
          // only thing that says the styling applied at all.
          eyebrowTransform: getComputedStyle(
            pageHeader.shadowRoot.querySelector('slot[name="eyebrow"]').assignedElements()[0],
          ).textTransform,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`the slot-shaped leaves: ${state.error}`);
    } else {
      for (const [which, value] of [
        ['trend', state.filledTrend],
        ['action', state.filledAction],
        ['icon', state.filledIcon],
      ]) {
        if (value === 'none') {
          problems.push(`the filled pf-metric-card hid its ${which} box`);
        }
      }
      for (const [which, value] of [
        ['trend', state.bareTrend],
        ['action', state.bareAction],
        ['icon', state.bareIcon],
      ]) {
        if (value !== 'none') {
          problems.push(
            `a bare pf-metric-card drew its ${which} box (display ${value}) — ` +
              'the empty class is not hiding it',
          );
        }
      }
      if (state.positivePill === state.negativePill) {
        problems.push(
          `a positive trend is the same colour as a negative one ("${state.positivePill}")`,
        );
      }
      if (isTransparent(state.cardBackground) || state.cardBorder === '0px') {
        problems.push(
          `pf-metric-card has no surface (background "${state.cardBackground}", ` +
            `border ${state.cardBorder})`,
        );
      }
      if (!state.cardsInARow || state.gridSlotDisplay !== 'contents') {
        problems.push(
          `the cards did not lay out as a row of grid items ` +
            `(slot display ${state.gridSlotDisplay}, in order: ${state.cardsInARow})`,
        );
      }
      if (!(state.headingSize > 28)) {
        problems.push(
          `the pf-page-header title computes ${state.headingSize}px — ` +
            'the clamp() did not resolve',
        );
      }
      if (state.breadcrumbsDisplay === 'none' || state.pageActions === 'none') {
        problems.push(
          `pf-page-header hid a box that has content in it ` +
            `(breadcrumbs ${state.breadcrumbsDisplay}, actions ${state.pageActions})`,
        );
      }
      if (state.sectionRule === '0px' || state.footerRule === '0px') {
        problems.push(
          `the section rules read ${state.sectionRule} / ${state.footerRule}, ` +
            'expected one under the header and one over the footer',
        );
      }
      if (state.sectionMetadata === 'none' || state.footerHeading === 'none') {
        problems.push(
          `a section box with content in it is hidden ` +
            `(metadata ${state.sectionMetadata}, footer heading ${state.footerHeading})`,
        );
      }
      if (state.eyebrowTransform !== 'uppercase') {
        problems.push(
          `the page header's eyebrow computes text-transform: ${state.eyebrowTransform} — ` +
            '::slotted() is the only styling it gets, and it did not apply',
        );
      }
    }
  }

  /*
   * The avatar group. Three claims that need a real stylesheet: the collapsed
   * avatars are gone, the shown ones overlap, and the chip takes its colours
   * through the --pf-avatar-* properties rather than from a rule reaching into
   * pf-avatar's shadow root.
   *
   * The overlap also exercises `::slotted(pf-avatar:not(:first-child))` — a
   * compound selector inside `::slotted()`, which is as far as that pseudo
   * goes: a sibling combinator cannot be written there at all.
   */
  {
    const state = await page
      .evaluate(() => {
        const group = document.querySelector('pf-avatar-group');
        if (!group) return { error: 'the consumer app has no pf-avatar-group' };

        const avatars = Array.from(group.querySelectorAll('pf-avatar'));
        const chip = group.shadowRoot.querySelector('[part="overflow"]');
        if (!chip) return { error: 'the group drew no overflow chip' };
        const boxes = avatars.map((avatar) => avatar.getBoundingClientRect());

        return {
          name: group.getAttribute('aria-label'),
          chipText: chip.textContent.trim(),
          chipBackground: getComputedStyle(chip).backgroundColor,
          plainBackground: getComputedStyle(avatars[0]).backgroundColor,
          /*
           * Read off the chip itself: this is the bridge, and the only
           * unambiguous evidence it applied. Comparing the chip's background
           * with a plain avatar's says nothing — both tokens resolve to
           * --color-semantic-background-subtle, so they are the same colour by
           * design, in this layer and in the React one.
           */
          chipBridge: getComputedStyle(chip).getPropertyValue('--pf-avatar-bg').trim(),
          plainBridge: getComputedStyle(avatars[0]).getPropertyValue('--pf-avatar-bg').trim(),
          chipRing: getComputedStyle(chip).boxShadow,
          avatarRing: getComputedStyle(avatars[0]).boxShadow,
          // The collapsed ones are gone; the shown ones overlap.
          displays: avatars.map((avatar) => getComputedStyle(avatar).display),
          firstRight: boxes[0].right,
          secondLeft: boxes[1].left,
          width: boxes[0].width,
          chipLeft: chip.getBoundingClientRect().left,
          secondRight: boxes[1].right,
          // Earlier avatars stack above later ones.
          zIndexes: avatars.map((avatar) => getComputedStyle(avatar).zIndex),
          positions: avatars.map((avatar) => getComputedStyle(avatar).position),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-avatar-group: ${state.error}`);
    } else {
      if (state.name !== '40 people') {
        problems.push(`pf-avatar-group is named "${state.name}", expected 40 people`);
      }
      if (state.chipText !== '+38') {
        problems.push(`the chip reads "${state.chipText}", expected +38`);
      }
      /*
       * Not `inline-flex`: the group is a flex container, so its children are
       * blockified to `flex`. What matters is which ones are gone.
       */
      if (
        state.displays[0] === 'none' ||
        state.displays[1] === 'none' ||
        state.displays[2] !== 'none' ||
        state.displays[3] !== 'none'
      ) {
        problems.push(
          `the avatars compute ${JSON.stringify(state.displays)} — ` +
            'expected the two past the maximum to be collapsed and the rest shown',
        );
      }
      if (!(state.secondLeft < state.firstRight)) {
        problems.push(
          `the second avatar starts at ${state.secondLeft}, right of the first's edge ` +
            `at ${state.firstRight} — they are not overlapping`,
        );
      }
      if (!(state.chipLeft < state.secondRight)) {
        problems.push(
          `the chip starts at ${state.chipLeft}, right of the last avatar's edge ` +
            `at ${state.secondRight} — it is not overlapping`,
        );
      }
      if (!state.chipBridge || state.chipBridge === state.plainBridge) {
        problems.push(
          `the chip's --pf-avatar-bg reads "${state.chipBridge}" against ` +
            `"${state.plainBridge}" on a plain avatar — the bridge did not reach it`,
        );
      }
      if (isTransparent(state.chipBackground)) {
        problems.push('the chip has no background');
      }
      if (state.avatarRing === 'none' || state.chipRing === 'none') {
        problems.push(
          `the separating ring is missing (avatar ${state.avatarRing}, chip ${state.chipRing})`,
        );
      }
      if (state.zIndexes.slice(0, 2).join(',') !== '2,1') {
        problems.push(
          `the shown avatars compute z-index ${JSON.stringify(state.zIndexes)}, ` +
            'expected the earlier one above the later',
        );
      }
      if (state.positions.slice(0, 2).some((position) => position === 'static')) {
        problems.push('a shown avatar is statically positioned, so its z-index does nothing');
      }
    }
  }

  /*
   * The button group, which is joined borders: each button laps one pixel over
   * the last, only the ends are rounded, and the rounding comes from
   * `:host(:first-child)` in the child's own sheet because `::slotted()` takes
   * no combinator. None of that is visible without a real stylesheet.
   */
  {
    const state = await page
      .evaluate(async () => {
        const group = document.querySelector('pf-button-group');
        if (!group) return { error: 'the consumer app has no pf-button-group' };

        const items = Array.from(group.querySelectorAll('pf-button-group-item'));
        if (items.length < 4) return { error: `only ${items.length} buttons in the fixture` };
        const button = (index) => items[index].shadowRoot.querySelector('[part="button"]');
        const box = (index) => button(index).getBoundingClientRect();
        const radius = (index) => getComputedStyle(button(index)).borderTopLeftRadius;

        const read = {
          pressed: items.map((node) =>
            node.shadowRoot.querySelector('[part="button"]').getAttribute('aria-pressed'),
          ),
          // Joined: each button's left edge is a pixel inside the last one's
          // right edge, so the shared border is drawn once.
          overlaps: items.slice(1).map((_, index) => box(index + 1).left - box(index).right),
          firstRadius: radius(0),
          middleRadius: radius(1),
          lastRadius: getComputedStyle(button(3)).borderTopRightRadius,
          selectedBackground: getComputedStyle(button(1)).backgroundColor,
          plainBackground: getComputedStyle(button(0)).backgroundColor,
          selectedText: getComputedStyle(button(1)).color,
          disabledOpacity: getComputedStyle(button(3)).opacity,
          plainOpacity: getComputedStyle(button(0)).opacity,
          dotBackground: getComputedStyle(items[2].shadowRoot.querySelector('[part="dot"]'))
            .backgroundColor,
        };

        /*
         * Choosing another button has to reach the host framework — and the
         * echo is waited for rather than sampled: the element writes its own
         * value first, and the framework's render lands a frame or two later.
         */
        button(0).click();
        const echo = () =>
          document.querySelector('[data-testid="button-group-value"]')?.textContent?.trim();
        const deadline = Date.now() + 3000;
        while (group.value !== 'day' || echo() !== 'day') {
          if (Date.now() > deadline) {
            return {
              ...read,
              echo: echo(),
              error: `the click did not take (value ${group.value})`,
            };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        return { ...read, echo: echo() };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-button-group: ${state.error}`);
    } else {
      if (state.pressed.join(',') !== 'false,true,false,false') {
        problems.push(
          `the buttons report aria-pressed ${JSON.stringify(state.pressed)}, ` +
            'expected the second one alone',
        );
      }
      if (!state.overlaps.every((gap) => Math.abs(gap + 1) < 0.5)) {
        problems.push(
          `the buttons are ${JSON.stringify(state.overlaps)} apart, expected -1 — ` +
            'they are not sharing a border',
        );
      }
      if (parseFloat(state.firstRadius) < 4 || parseFloat(state.lastRadius) < 4) {
        problems.push(
          `the group's ends are not rounded (${state.firstRadius} / ${state.lastRadius}) — ` +
            ':host(:first-child) did not match',
        );
      }
      if (state.middleRadius !== '0px') {
        problems.push(`a middle button is rounded (${state.middleRadius})`);
      }
      if (state.selectedBackground === state.plainBackground) {
        problems.push(
          `the chosen button looks the same as the others ("${state.plainBackground}")`,
        );
      }
      if (isTransparent(state.selectedText) || state.selectedText === 'rgb(0, 0, 0)') {
        problems.push(
          `the chosen button's text computes ${state.selectedText} — ` +
            'a --pf-buttongroup-* alias did not resolve',
        );
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `a disabled button looks the same as an enabled one (opacity ${state.plainOpacity})`,
        );
      }
      if (isTransparent(state.dotBackground)) {
        problems.push('the dot has no colour');
      }
      if (state.echo !== 'day') {
        problems.push(
          `pf-button-group reported "${state.echo}" to the host framework, expected day`,
        );
      }
    }
  }

  /*
   * The inline prompt, and specifically its exit. The stylesheet's own
   * animation is the thing no test project can see: `getAnimations()` is the
   * only check that tells a working animation from a declared one, because an
   * undefined duration token computes the whole shorthand away — pf-modal's
   * mistake. Dismissing it also has to reach the host framework, which is what
   * removes it from the page.
   */
  {
    const state = await page
      .evaluate(async () => {
        const cta = document.querySelector('pf-inline-cta');
        if (!cta) return { error: 'the consumer app has no pf-inline-cta' };

        const part = (name) => cta.shadowRoot.querySelector(`[part="${name}"]`);
        const read = {
          background: getComputedStyle(cta).backgroundColor,
          border: getComputedStyle(cta).borderTopWidth,
          iconColour: getComputedStyle(part('icon')).color,
          headingWeight: getComputedStyle(part('heading')).fontWeight,
          actionDisplay: getComputedStyle(part('action')).display,
          // The dismiss button is centred in the padding the tone reserves.
          dismissRight: part('dismiss').getBoundingClientRect().right,
          ctaRight: cta.getBoundingClientRect().right,
        };

        // Dismiss it, and watch the animation actually run.
        part('dismiss').click();
        const deadline = Date.now() + 3000;
        while (!cta.hasAttribute('exiting')) {
          if (Date.now() > deadline) return { ...read, error: 'the exit never started' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        const animations = cta.getAnimations().map((animation) => ({
          name: animation.animationName ?? null,
          duration: animation.effect?.getTiming().duration ?? 0,
        }));

        // And watch the host framework take it off the page.
        const gone = await new Promise((resolve) => {
          const since = Date.now();
          const tick = () => {
            if (!document.querySelector('pf-inline-cta')) return resolve(true);
            if (Date.now() - since > 3000) return resolve(false);
            requestAnimationFrame(tick);
          };
          tick();
        });

        return {
          ...read,
          animations,
          gone,
          echo: document.querySelector('[data-testid="inline-cta-echo"]')?.textContent?.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-inline-cta: ${state.error}`);
    } else {
      if (isTransparent(state.background) || state.border === '0px') {
        problems.push(
          `pf-inline-cta has no surface (background "${state.background}", ` +
            `border ${state.border})`,
        );
      }
      if (state.iconColour === 'rgb(0, 0, 0)') {
        problems.push(
          `the icon computes colour ${state.iconColour}, the initial value — ` +
            'a --pf-inline-cta-* alias did not resolve',
        );
      }
      if (state.actionDisplay === 'none') {
        problems.push('the action box is hidden although something is slotted into it');
      }
      if (!(state.dismissRight < state.ctaRight)) {
        problems.push(
          `the dismiss button's right edge is ${state.dismissRight} against the ` +
            `prompt's ${state.ctaRight} — it is outside the padding reserved for it`,
        );
      }
      const running = state.animations.filter(
        (animation) => animation.name && animation.duration > 0,
      );
      if (running.length === 0) {
        problems.push(
          'dismissing pf-inline-cta ran no animation — it vanishes rather than leaving ' +
            `(${JSON.stringify(state.animations)})`,
        );
      }
      if (!state.gone || state.echo !== 'dismissed') {
        problems.push(
          `the host framework did not take the prompt off the page ` +
            `(gone: ${state.gone}, echo: "${state.echo}")`,
        );
      }
    }
  }

  /*
   * The stepper's own claims that need a real build: the two buttons sit
   * either side of the input with the shared borders drawn once, and the
   * button that cannot move is dimmed. Stepping also has to reach the host
   * framework, which is the pf-command-item class of bug.
   */
  {
    const state = await page
      .evaluate(async () => {
        const field = document.querySelector('pf-number-input');
        if (!field) return { error: 'the consumer app has no pf-number-input' };

        const part = (name) => field.shadowRoot.querySelector(`[part="${name}"]`);
        const boxes = ['decrement', 'input', 'increment'].map((name) =>
          part(name).getBoundingClientRect(),
        );

        const read = {
          // Left to right, with the input between the two steppers.
          inOrder: boxes[0].right <= boxes[1].left + 1 && boxes[1].right <= boxes[2].left + 1,
          control: getComputedStyle(part('control')).borderTopWidth,
          stepBackground: getComputedStyle(part('decrement')).backgroundColor,
          inputBackground: getComputedStyle(part('input')).backgroundColor,
          dividers: [
            getComputedStyle(part('decrement')).borderInlineEndWidth,
            getComputedStyle(part('increment')).borderInlineStartWidth,
          ],
          centred: getComputedStyle(part('input')).textAlign,
        };

        // Step to the maximum and watch the button dim and the echo follow.
        part('increment').click();
        const deadline = Date.now() + 3000;
        while (field.value !== '2.5') {
          if (Date.now() > deadline) return { ...read, error: 'stepping did not take' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        /*
         * Clicked up to the maximum rather than assigned: the host framework
         * holds `value` and writes it back on every pfChange, so an assignment
         * from out here is overwritten by the next render — measured, as a
         * value that stayed at 2.5. Fifteen steps of 0.5 is the real path a
         * user takes anyway.
         */
        for (let click = 0; click < 40 && !part('increment').disabled; click += 1) {
          part('increment').click();
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        if (!part('increment').disabled) {
          return { ...read, error: `the top button never dimmed (value ${field.value})` };
        }

        return {
          ...read,
          disabledOpacity: getComputedStyle(part('increment')).opacity,
          plainOpacity: getComputedStyle(part('decrement')).opacity,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-number-input: ${state.error}`);
    } else {
      if (!state.inOrder) {
        problems.push('the stepper buttons are not laid out either side of the input');
      }
      if (state.control === '0px') {
        problems.push('pf-number-input has no border — a --pf-numberinput-* alias is missing');
      }
      if (state.stepBackground === state.inputBackground) {
        problems.push(
          `the stepper buttons are the same colour as the field ` + `("${state.inputBackground}")`,
        );
      }
      if (state.dividers.some((width) => width === '0px')) {
        problems.push(
          `the stepper dividers read ${JSON.stringify(state.dividers)}, expected one each`,
        );
      }
      if (state.centred !== 'center') {
        problems.push(`the stepper's value is ${state.centred}, expected centred`);
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `the button that cannot move looks the same as the one that can ` +
            `(opacity ${state.plainOpacity})`,
        );
      }
    }
  }

  /*
   * The table, and specifically the CSS-table layout it is built on: a row has
   * to be a box — that is what lets it take the stripe and the hover, where a
   * grid's `display: contents` row takes neither — and the cells have to line
   * up in columns across rows all the same.
   *
   * The sort is reported rather than performed, so what is checked is the
   * round trip: the header reports, the app sorts its own rows, and the first
   * row changes.
   */
  {
    const state = await page
      .evaluate(async () => {
        const table = document.querySelector('pf-table');
        if (!table) return { error: 'the consumer app has no pf-table' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const rows = () =>
          [...table.querySelectorAll('pf-table-row')].filter((row) => row.parentElement === table);
        const bodyRows = () => rows().filter((row) => !row.hasAttribute('head'));
        const headCells = [...table.querySelectorAll('pf-table-row[head] pf-table-cell')];
        const cellsOf = (row) => [...row.querySelectorAll('pf-table-cell')];

        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const first = bodyRows()[0];
        const second = bodyRows()[1];
        const read = {
          rowDisplay: getComputedStyle(first).display,
          cellDisplay: getComputedStyle(cellsOf(first)[0]).display,
          tableDisplay: getComputedStyle(part(table, 'table')).display,
          // A row with a box has a height; a display: contents row has none.
          rowHeight: first.getBoundingClientRect().height,
          // Columns line up across rows, which is the whole point of the table
          // layout: no grid-template is computed anywhere.
          columnsAligned: cellsOf(first).every(
            (cell, index) =>
              Math.abs(
                cell.getBoundingClientRect().left -
                  cellsOf(second)[index].getBoundingClientRect().left,
              ) < 1,
          ),
          stripe: getComputedStyle(second).backgroundColor,
          plainRow: getComputedStyle(first).backgroundColor,
          headBackground: getComputedStyle(headCells[0]).backgroundColor,
          headPosition: getComputedStyle(headCells[0]).position,
          // The right-aligned column is aligned, and its width was taken.
          alignment: getComputedStyle(cellsOf(first)[1]).textAlign,
          totalWidth: cellsOf(first)[1].getBoundingClientRect().width,
          captionBorder: getComputedStyle(part(table, 'caption')).borderBottomWidth,
          firstRowText: cellsOf(first)[0].textContent.trim(),
        };

        // Sort on the second column and watch the app reorder its own rows.
        part(headCells[1], 'sort').click();
        const deadline = Date.now() + 3000;
        while (headCells[1].getAttribute('aria-sort') !== 'ascending') {
          if (Date.now() > deadline) return { ...read, error: 'the header never sorted' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await settle();

        return {
          ...read,
          sortedFirstRowText: cellsOf(bodyRows()[0])[0].textContent.trim(),
          echo: document.querySelector('[data-testid="table-sort"]')?.textContent?.trim(),
          indicator: part(headCells[1], 'indicator')?.textContent?.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-table: ${state.error}`);
    } else {
      if (state.tableDisplay !== 'table' || state.rowDisplay !== 'table-row') {
        problems.push(
          `the table computes display ${state.tableDisplay} with ${state.rowDisplay} rows, ` +
            'expected a CSS table — a row with no box takes no stripe and no hover',
        );
      }
      if (state.cellDisplay !== 'table-cell') {
        problems.push(`a cell computes display: ${state.cellDisplay}`);
      }
      if (!(state.rowHeight > 0)) {
        problems.push(`a row measured ${state.rowHeight}px tall, so it has no box`);
      }
      if (!state.columnsAligned) {
        problems.push('the cells do not line up in columns across rows');
      }
      if (state.stripe === state.plainRow) {
        problems.push(
          `a striped row is the same colour as a plain one ("${state.plainRow}") — ` +
            'the --pf-table-row-stripe bridge did not reach it',
        );
      }
      if (state.headBackground === state.plainRow) {
        problems.push('the header is the same colour as a body row');
      }
      if (state.headPosition !== 'sticky') {
        problems.push(
          `the header computes position: ${state.headPosition} — ` +
            'the --pf-table-head-position bridge did not reach it',
        );
      }
      if (state.alignment !== 'right' && state.alignment !== 'end') {
        problems.push(`the right-aligned column computes text-align: ${state.alignment}`);
      }
      if (Math.abs(state.totalWidth - 140) > 2) {
        problems.push(
          `the column with width="140px" measured ${state.totalWidth}px — ` +
            'the header cell’s width did not set the column',
        );
      }
      if (state.captionBorder === '0px') {
        problems.push('the caption has no rule under it');
      }
      if (state.firstRowText === state.sortedFirstRowText) {
        problems.push(
          `the rows did not change when the table reported a sort ` +
            `(still "${state.firstRowText}") — the app sorts its own rows, so this is ` +
            'the round trip through the host framework',
        );
      }
      if (state.echo !== 'total asc') {
        problems.push(`pf-table reported "${state.echo}" to the host framework`);
      }
      if (state.indicator !== '^') {
        problems.push(`the sort indicator reads "${state.indicator}", expected ^`);
      }
    }
  }

  /*
   * The tree, and the measurement it is built on: the tree holds the tab stop
   * and names the active item with an IDREF, because a `tabindex="0"` host
   * slotted into another host's shadow tree is skipped by sequential
   * navigation when the outer host's tabindex is negative. Asserted here in a
   * real build, and with it the indent, which comes from the nesting rather
   * than from a level pushed into a custom property.
   */
  {
    const state = await page
      .evaluate(async () => {
        const tree = document.querySelector('pf-tree-view');
        if (!tree) return { error: 'the consumer app has no pf-tree-view' };

        const item = (value) => tree.querySelector(`pf-tree-item[value="${value}"]`);
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const activeValue = () =>
          [...tree.querySelectorAll('pf-tree-item')]
            .find((node) => node.hasAttribute('active'))
            ?.getAttribute('value') ?? null;
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const read = {
          treeTabindex: tree.getAttribute('tabindex'),
          itemTabStops: [...tree.querySelectorAll('pf-tree-item')].filter(
            (node) => node.getAttribute('tabindex') === '0',
          ).length,
          pointsAt: (() => {
            const id = tree.getAttribute('aria-activedescendant');
            return id ? (tree.querySelector(`#${id}`)?.getAttribute('value') ?? null) : null;
          })(),
          // The indent: a nested row starts to the right of its parent's.
          rootRowLeft: part(item('src'), 'row').getBoundingClientRect().left,
          childRowLeft: part(item('index.ts'), 'row').getBoundingClientRect().left,
          grandchildIndent: (() => {
            const components = part(item('components'), 'row').getBoundingClientRect().left;
            return components - part(item('src'), 'row').getBoundingClientRect().left;
          })(),
          // A closed branch's children take no space at all.
          closedBranchHeight: part(item('components'), 'children').getBoundingClientRect().height,
          openBranchHeight: part(item('src'), 'children').getBoundingClientRect().height,
          selectedBackground: getComputedStyle(part(item('index.ts'), 'row')).backgroundColor,
          plainBackground: getComputedStyle(part(item('package.json'), 'row')).backgroundColor,
          disabledOpacity: getComputedStyle(part(item('node_modules'), 'row')).opacity,
          plainOpacity: getComputedStyle(part(item('package.json'), 'row')).opacity,
          // The ring is drawn only while the tree itself has focus.
          ringWhenBlurred: getComputedStyle(part(item('index.ts'), 'row')).boxShadow,
        };

        tree.focus();
        await settle();
        const ringWhenFocused = getComputedStyle(part(item('index.ts'), 'row')).boxShadow;

        // Selecting from the keyboard has to reach the host framework.
        tree.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
        );
        const deadline = Date.now() + 3000;
        while (activeValue() !== 'components') {
          if (Date.now() > deadline) {
            return { ...read, ringWhenFocused, error: `the arrow did not move (${activeValue()})` };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        tree.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
        );
        const echo = () =>
          document.querySelector('[data-testid="tree-value"]')?.textContent?.trim();
        while (!echo()?.startsWith('components')) {
          if (Date.now() > deadline) {
            return { ...read, ringWhenFocused, echo: echo(), error: 'the selection never echoed' };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        return {
          ...read,
          ringWhenFocused,
          focusedTree: document.activeElement === tree,
          echo: echo(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-tree-view: ${state.error}`);
    } else {
      if (state.treeTabindex !== '0' || state.itemTabStops !== 0) {
        problems.push(
          `the tree has tabindex ${state.treeTabindex} and ${state.itemTabStops} item tab ` +
            'stops, expected the tree to hold the only one',
        );
      }
      if (state.pointsAt !== 'index.ts') {
        problems.push(
          `aria-activedescendant points at "${state.pointsAt}", expected the selected item`,
        );
      }
      if (!(state.childRowLeft > state.rootRowLeft)) {
        problems.push(
          `a nested row starts at ${state.childRowLeft} against its parent's ` +
            `${state.rootRowLeft} — the indent did not apply`,
        );
      }
      if (Math.abs(state.grandchildIndent - (state.childRowLeft - state.rootRowLeft)) > 1) {
        problems.push('the indent is not one step per level of nesting');
      }
      if (state.closedBranchHeight !== 0) {
        problems.push(
          `a closed branch measured ${state.closedBranchHeight}px — its children are still laid out`,
        );
      }
      if (!(state.openBranchHeight > 0)) {
        problems.push(`an open branch measured ${state.openBranchHeight}px`);
      }
      if (state.selectedBackground === state.plainBackground) {
        problems.push(
          `the selected row is the same colour as a plain one ("${state.plainBackground}")`,
        );
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `a disabled row looks the same as an enabled one (opacity ${state.plainOpacity})`,
        );
      }
      if (state.ringWhenBlurred !== 'none') {
        problems.push(
          `the active row has a ring while the tree is not focused ` +
            `("${state.ringWhenBlurred}")`,
        );
      }
      if (state.ringWhenFocused === 'none') {
        problems.push(
          'the active row has no ring while the tree is focused — the ' +
            '--pf-tree-active-ring bridge did not reach it',
        );
      }
      if (!state.focusedTree) {
        problems.push('the keyboard moved the focus off the tree');
      }
      if (!state.echo?.startsWith('components')) {
        problems.push(`pf-tree-view reported "${state.echo}" to the host framework`);
      }
    }
  }

  /*
   * The carousel, whose whole layout is the thing no test project can see:
   * `flex: 0 0 100%` on the slides and a percentage transform on the track
   * only agree when the stylesheet is loaded. So this measures the geometry —
   * one slide fills the viewport, the next one sits outside the clip, and a
   * step brings it to exactly where the first one was — plus the transition
   * that carries it there and the dot that marks it.
   */
  {
    const state = await page
      .evaluate(async () => {
        const carousel = document.querySelector('pf-carousel');
        if (!carousel) return { error: 'the consumer app has no pf-carousel' };

        const part = (name) => carousel.shadowRoot.querySelector(`[part="${name}"]`);
        const slides = () => [...carousel.querySelectorAll('pf-carousel-slide')];
        const dots = () => [...carousel.shadowRoot.querySelectorAll('[part="indicator"]')];
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const viewport = part('viewport').getBoundingClientRect();
        const first = slides()[0].getBoundingClientRect();
        const second = slides()[1].getBoundingClientRect();

        const read = {
          // One slide per viewport, which is what the transform steps by.
          slideWidth: first.width,
          viewportWidth: viewport.width,
          // The next slide is laid out past the clip, not stacked underneath.
          secondLeftOffset: second.left - viewport.right,
          clipped: getComputedStyle(part('viewport')).overflow,
          activeDotWidth: dots()[0].getBoundingClientRect().width,
          plainDotWidth: dots()[1].getBoundingClientRect().width,
          activeDotBackground: getComputedStyle(dots()[0]).backgroundColor,
          plainDotBackground: getComputedStyle(dots()[1]).backgroundColor,
          dotCount: dots().length,
          // A slide nobody can see must not be a tab stop nobody can see.
          hiddenSlideTakesFocus: (() => {
            const button = document.querySelector('[data-testid="carousel-slide-2-button"]');
            button?.focus();
            return document.activeElement === button;
          })(),
        };

        part('next').click();

        /*
         * The transition is the point of the track, so wait for it rather
         * than sampling: `getAnimations()` is empty before the browser has
         * started it and empty again once it has finished.
         */
        const deadline = Date.now() + 3000;
        let transitioned = false;
        while (!transitioned) {
          if (Date.now() > deadline) break;
          transitioned = part('track')
            .getAnimations()
            .some((animation) => animation.transitionProperty === 'transform');
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await Promise.all(
          part('track')
            .getAnimations()
            .map((animation) => animation.finished),
        );
        await settle();

        const echo = () =>
          document.querySelector('[data-testid="carousel-index"]')?.textContent?.trim();
        while (echo() !== '1') {
          if (Date.now() > deadline) {
            return { ...read, transitioned, echo: echo(), error: 'the step never echoed' };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        const movedSecond = slides()[1].getBoundingClientRect();
        return {
          ...read,
          transitioned,
          echo: echo(),
          // It landed where the first slide was, which is what makes it the
          // one on show rather than merely the one marked.
          landedOffset: movedSecond.left - viewport.left,
          activeNowSecond: slides()[1].hasAttribute('active'),
          shownSlideTakesFocus: (() => {
            const button = document.querySelector('[data-testid="carousel-slide-2-button"]');
            button?.focus();
            return document.activeElement === button;
          })(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-carousel: ${state.error}`);
    } else {
      if (Math.abs(state.slideWidth - state.viewportWidth) > 1) {
        problems.push(
          `a slide measured ${state.slideWidth}px in a ${state.viewportWidth}px viewport — ` +
            'the flex basis did not apply',
        );
      }
      if (state.secondLeftOffset < -1) {
        problems.push(
          `the second slide starts ${-state.secondLeftOffset}px inside the viewport — the ` +
            'slides are stacked rather than laid out in a strip',
        );
      }
      if (state.clipped !== 'hidden') {
        problems.push(`the viewport's overflow reads "${state.clipped}", expected hidden`);
      }
      if (!(state.activeDotWidth > state.plainDotWidth)) {
        problems.push(
          `the active dot measured ${state.activeDotWidth}px against a plain one's ` +
            `${state.plainDotWidth}px — it is not marked`,
        );
      }
      if (state.activeDotBackground === state.plainDotBackground) {
        problems.push(
          `the active dot is the same colour as a plain one ("${state.plainDotBackground}")`,
        );
      }
      if (state.dotCount !== 3) {
        problems.push(`the carousel drew ${state.dotCount} dots for 3 slides`);
      }
      if (state.hiddenSlideTakesFocus) {
        problems.push('a button in an off-screen slide took focus — the slide is not inert');
      }
      if (!state.transitioned) {
        problems.push('the track did not transition — the transform was applied without animating');
      }
      if (Math.abs(state.landedOffset) > 1) {
        problems.push(
          `the second slide came to rest ${state.landedOffset}px from the viewport's edge`,
        );
      }
      if (!state.activeNowSecond) {
        problems.push('the second slide was never marked active');
      }
      if (!state.shownSlideTakesFocus) {
        problems.push('a button in the slide on show could not take focus — it is still inert');
      }
      if (state.echo !== '1') {
        problems.push(`pf-carousel reported "${state.echo}" to the host framework`);
      }
    }
  }

  /*
   * The header navigation, and the two things only a build can show: the
   * brand box really collapsing when nothing is slotted into it — a wrapper
   * around a slot cannot be collapsed from CSS, so the class the element sets
   * has to meet a rule that wins on source order — and the `--pf-nav-item-*`
   * bridge reaching a slotted item inside its own shadow root, which is how
   * one item element serves two navigations.
   */
  {
    const state = await page
      .evaluate(async () => {
        const nav = document.querySelector('pf-header-navigation');
        if (!nav) return { error: 'the consumer app has no pf-header-navigation' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const item = (testid) => document.querySelector(`[data-testid="${testid}"]`);
        const box = (testid) => part(item(testid), 'link');
        for (let i = 0; i < 4; i += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        const current = box('header-nav-current');
        const plain = box('header-nav-plain');
        const disabled = box('header-nav-disabled');

        return {
          landmarks: [...nav.shadowRoot.querySelectorAll('nav')].length,
          hostRole: nav.getAttribute('role'),
          // The brand is slotted here and the box is drawn; nothing is
          // slotted into the carousel's empty state, which the carousel
          // block covers.
          brandDrawn: getComputedStyle(part(nav, 'brand')).display !== 'none',
          itemsOnOneRow:
            new Set(
              ['header-nav-current', 'header-nav-plain', 'header-nav-disabled'].map((id) =>
                Math.round(item(id).getBoundingClientRect().top),
              ),
            ).size === 1,
          // The bridge: the current item's colours come from the header's
          // aliases, read inside the item's own shadow root.
          currentBackground: getComputedStyle(current).backgroundColor,
          plainBackground: getComputedStyle(plain).backgroundColor,
          currentColor: getComputedStyle(current).color,
          plainColor: getComputedStyle(plain).color,
          bridge: getComputedStyle(item('header-nav-current'))
            .getPropertyValue('--pf-nav-item-current-bg')
            .trim(),
          // Only one item announces the page, however many asked.
          announced: [...nav.querySelectorAll('pf-nav-item')].filter(
            (node) => part(node, 'link').getAttribute('aria-current') === 'page',
          ).length,
          secondAsked: item('header-nav-second').hasAttribute('current'),
          // A disabled item is no anchor at all, so it is not a tab stop.
          disabledTag: disabled.tagName.toLowerCase(),
          disabledOpacity: getComputedStyle(disabled).opacity,
          plainOpacity: getComputedStyle(plain).opacity,
          disabledTakesFocus: (() => {
            disabled.focus?.();
            return item('header-nav-disabled').shadowRoot.activeElement === disabled;
          })(),
          /*
           * A second navigation with nothing slotted into either box. The
           * boxes are grid items, so one that draws anyway costs a column and
           * a gap, and the first item starts a `--space-3` further in than the
           * navigation's own padding. A wrapper around a slot cannot be
           * collapsed from CSS, and the class that collapses it has to beat
           * the `display` the box sets on itself — which it only does by
           * being two classes deep, because the ties break on source order.
           */
          bare: (() => {
            const bare = document.querySelector('[data-testid="header-navigation-bare"]');
            if (!bare) return null;
            const firstItem = bare.querySelector('pf-nav-item');
            return {
              brandDisplay: getComputedStyle(part(bare, 'brand')).display,
              actionsDisplay: getComputedStyle(part(bare, 'actions')).display,
              brandSlotPresent: part(bare, 'brand').querySelector('slot') !== null,
              itemOffset:
                firstItem.getBoundingClientRect().left -
                part(bare, 'list').getBoundingClientRect().left,
            };
          })(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-header-navigation: ${state.error}`);
    } else {
      if (state.landmarks !== 1 || state.hostRole !== null) {
        problems.push(
          `the navigation rendered ${state.landmarks} nav landmarks and a host role of ` +
            `"${state.hostRole}" — expected one landmark and no banner`,
        );
      }
      if (!state.brandDrawn) {
        problems.push('the brand box stayed collapsed with something slotted into it');
      }
      if (!state.itemsOnOneRow) {
        problems.push('the items did not lay out on one row');
      }
      if (state.currentBackground === state.plainBackground) {
        problems.push(
          `the current item is the same colour as a plain one ("${state.plainBackground}") — ` +
            'the --pf-nav-item-current-bg bridge did not reach it',
        );
      }
      if (state.currentColor === state.plainColor) {
        problems.push(`the current item's text is the same colour as a plain one's`);
      }
      if (!state.bridge) {
        problems.push('--pf-nav-item-current-bg resolved to nothing on the item');
      }
      if (state.announced !== 1) {
        problems.push(`${state.announced} items announced aria-current="page" — exactly one may`);
      }
      if (!state.secondAsked) {
        problems.push('the group cleared the second item’s current attribute');
      }
      if (state.disabledTag !== 'span') {
        problems.push(
          `a disabled item rendered a <${state.disabledTag}> — an anchor has no disabled state`,
        );
      }
      if (state.disabledTakesFocus) {
        problems.push('a disabled item took focus');
      }
      if (state.disabledOpacity === state.plainOpacity) {
        problems.push(
          `a disabled item looks the same as an enabled one (opacity ${state.plainOpacity})`,
        );
      }
      if (!state.bare) {
        problems.push('the consumer app has no bare pf-header-navigation to check');
      } else {
        if (state.bare.brandDisplay !== 'none' || state.bare.actionsDisplay !== 'none') {
          problems.push(
            `an unslotted brand box computes to "${state.bare.brandDisplay}" and an unslotted ` +
              `actions box to "${state.bare.actionsDisplay}" — both should be none`,
          );
        }
        if (!state.bare.brandSlotPresent) {
          problems.push(
            'the hidden brand box dropped its slot, so content added later would never show',
          );
        }
        if (Math.abs(state.bare.itemOffset) > 1) {
          problems.push(
            `the first item of a bare navigation starts ${state.bare.itemOffset}px into its ` +
              'list — an empty box is still taking a column',
          );
        }
      }
    }
  }

  /*
   * The sidebar navigation, and the three things only a build shows: the
   * `--pf-nav-item-*` bridge resolving to the *sidebar's* aliases rather than
   * the header's on the very same element, the footer's rule not being drawn
   * across an empty box, and the vertical layout — one item per row, each
   * filling the list, with the badge pushed to the far edge by the label
   * taking the slack.
   */
  {
    const state = await page
      .evaluate(async () => {
        const nav = document.querySelector('pf-sidebar-navigation');
        if (!nav) return { error: 'the consumer app has no pf-sidebar-navigation' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const item = (testid) => document.querySelector(`[data-testid="${testid}"]`);
        const box = (testid) => part(item(testid), 'link');
        for (let i = 0; i < 4; i += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        const current = box('sidebar-nav-current');
        const plain = box('sidebar-nav-plain');
        const section = item('sidebar-section');
        const untitled = item('sidebar-section-untitled');
        const headerItem = item('header-nav-current');

        const badge = item('sidebar-nav-current').querySelector('pf-badge');
        const label = item('sidebar-nav-current').shadowRoot.querySelector('[part="label"]');

        return {
          footerDrawn: getComputedStyle(part(nav, 'footer')).display !== 'none',
          headerDrawn: getComputedStyle(part(nav, 'header')).display !== 'none',
          // The sections own the lists; the navigation renders none.
          navLists: nav.shadowRoot.querySelectorAll('ul').length,
          sectionList: part(section, 'list').tagName.toLowerCase(),
          titleDrawn: getComputedStyle(part(section, 'title')).display !== 'none',
          untitledDrawn: getComputedStyle(part(untitled, 'title')).display !== 'none',
          /*
           * The one measurement that really shows the orientation arriving:
           * the *same element* is taller and more generously padded in the
           * sidebar than in the header. Its width proves nothing — the link
           * box is a block-level flex container either way, so it fills the
           * list whatever the vertical rule says.
           */
          verticalHeight: current.getBoundingClientRect().height,
          horizontalHeight: headerItem
            ? part(headerItem, 'link').getBoundingClientRect().height
            : null,
          verticalPadding: getComputedStyle(current).paddingLeft,
          horizontalPadding: headerItem
            ? getComputedStyle(part(headerItem, 'link')).paddingLeft
            : null,
          onSeparateRows:
            Math.round(item('sidebar-nav-plain').getBoundingClientRect().top) >
            Math.round(item('sidebar-nav-current').getBoundingClientRect().bottom - 1),
          // The label takes the slack, so the badge sits at the far edge.
          badgeGap: current.getBoundingClientRect().right - badge.getBoundingClientRect().right,
          labelFlex: getComputedStyle(label).flexGrow,
          /*
           * The bridge, read on the item itself. There is no `:root` default
           * behind it, so a missing bridge resolves to nothing and kills the
           * declaration at computed-value time — which is also what the
           * colour comparison below then sees. The sidebar's and the header's
           * aliases happen to resolve to the same token today, so comparing
           * the two would prove nothing.
           */
          sidebarAlias: getComputedStyle(item('sidebar-nav-current'))
            .getPropertyValue('--pf-nav-item-text')
            .trim(),
          headerPresent: headerItem !== null,
          currentBackground: getComputedStyle(current).backgroundColor,
          plainBackground: getComputedStyle(plain).backgroundColor,
          announced: [...nav.querySelectorAll('pf-nav-item')].filter(
            (node) => part(node, 'link').getAttribute('aria-current') === 'page',
          ).length,
          secondAsked: item('sidebar-nav-second').hasAttribute('current'),
          // The same-root IDREF the section's title names its list with.
          /*
           * Read through the slot, because the title box holds only a
           * `<slot>`: its own `textContent` is the empty fallback, while the
           * accessibility tree names the list from the flattened tree.
           */
          namedBy: (() => {
            const id = part(section, 'list').getAttribute('aria-labelledby');
            if (!id) return null;
            const target = section.shadowRoot.getElementById(id);
            const slot = target?.querySelector('slot');
            return slot
              ?.assignedNodes()
              .map((node) => node.textContent)
              .join('')
              .trim();
          })(),
          untitledNamedBy: part(untitled, 'list').getAttribute('aria-labelledby'),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-sidebar-navigation: ${state.error}`);
    } else {
      if (!state.footerDrawn || !state.headerDrawn) {
        problems.push('the sidebar collapsed a box that had something slotted into it');
      }
      if (state.navLists !== 0 || state.sectionList !== 'ul') {
        problems.push(
          `the navigation rendered ${state.navLists} lists of its own and the section a ` +
            `<${state.sectionList}> — the sections own the lists`,
        );
      }
      if (!state.titleDrawn) {
        problems.push('a section with a title did not draw it');
      }
      if (state.untitledDrawn) {
        problems.push('a section with no title drew an empty title box');
      }
      if (state.untitledNamedBy !== null) {
        problems.push(
          `an untitled section named its list with "${state.untitledNamedBy}", which names it ` +
            'with an empty string rather than not at all',
        );
      }
      if (state.namedBy !== 'Main') {
        problems.push(`the section's list is named "${state.namedBy}", expected Main`);
      }
      if (!(state.verticalHeight > state.horizontalHeight)) {
        problems.push(
          `the same item measured ${state.verticalHeight}px in the sidebar and ` +
            `${state.horizontalHeight}px in the header — the orientation did not reach it`,
        );
      }
      if (state.verticalPadding === state.horizontalPadding) {
        problems.push(`the same item is padded ${state.verticalPadding} in both orientations`);
      }
      if (!state.onSeparateRows) {
        problems.push('the sidebar items laid out on one row');
      }
      if (state.badgeGap > 24) {
        problems.push(
          `the badge sits ${state.badgeGap}px from the item's edge — the label is not taking ` +
            'the slack',
        );
      }
      if (state.labelFlex === '0') {
        problems.push("the label's flex-grow is 0 in a vertical item");
      }
      if (!state.sidebarAlias) {
        problems.push('--pf-nav-item-text resolved to nothing inside the sidebar');
      }
      if (!state.headerPresent) {
        problems.push('the consumer app no longer shows the same item in a header navigation');
      }
      if (state.currentBackground === state.plainBackground) {
        problems.push(
          `the current item is the same colour as a plain one ("${state.plainBackground}")`,
        );
      }
      if (state.announced !== 1) {
        problems.push(
          `${state.announced} sidebar items announced aria-current="page" — exactly one may`,
        );
      }
      if (!state.secondAsked) {
        problems.push('the sidebar cleared the second item’s current attribute');
      }
    }
  }

  /*
   * The splitter, whose point is a layout: the first panel takes the share
   * the separator reports and the second takes the rest, which only the
   * stylesheet's `flex` rules make true. Dragged with a real pointer against
   * a real build, because the share is read off the host's own box and a
   * stylesheet that failed to load would leave the panels stacked at their
   * content widths with every attribute still correct.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-resizable');
        if (!el) return { error: 'the consumer app has no pf-resizable' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const host = el.getBoundingClientRect();
        const handle = part('handle');
        const start = part('start').getBoundingClientRect();
        const end = part('end').getBoundingClientRect();
        const handleBox = handle.getBoundingClientRect();

        const read = {
          reported: Number(handle.getAttribute('aria-valuenow')),
          startShare: (start.width / host.width) * 100,
          // The three boxes fill the host between them, side by side.
          sideBySide:
            Math.round(start.right) <= Math.round(handleBox.left) + 1 &&
            Math.round(handleBox.right) <= Math.round(end.left) + 1,
          covered: (start.width + handleBox.width + end.width) / host.width,
          handleWidth: handleBox.width,
          handleCursor: getComputedStyle(handle).cursor,
          // A drag must not be turned into a page scroll by the browser.
          touchAction: getComputedStyle(handle).touchAction,
          grip: getComputedStyle(part('grip')).backgroundColor,
          ringWhenBlurred: getComputedStyle(handle).boxShadow,
        };

        // A real drag, with real pointer capture, to a quarter of the host.
        const target = host.left + host.width * 0.25;
        handle.dispatchEvent(
          new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }),
        );
        handle.dispatchEvent(
          new PointerEvent('pointermove', {
            pointerId: 1,
            clientX: target,
            clientY: host.top + 10,
            bubbles: true,
            composed: true,
          }),
        );

        const echo = () =>
          document.querySelector('[data-testid="resizable-size"]')?.textContent?.trim();
        const deadline = Date.now() + 3000;
        while (echo() !== '25') {
          if (Date.now() > deadline) {
            return { ...read, echo: echo(), error: 'the drag never echoed' };
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        handle.dispatchEvent(
          new PointerEvent('pointerup', { pointerId: 1, bubbles: true, composed: true }),
        );
        await settle();

        const ringWhenFocused = getComputedStyle(handle).boxShadow;
        const draggedStart = part('start').getBoundingClientRect();

        return {
          ...read,
          echo: echo(),
          ringWhenFocused,
          draggedShare: (draggedStart.width / host.width) * 100,
          // The separator sits where the pointer left it.
          handleAtPointer: Math.abs(part('handle').getBoundingClientRect().left - target),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-resizable: ${state.error}`);
    } else {
      if (Math.abs(state.startShare - state.reported) > 2) {
        problems.push(
          `the first panel takes ${state.startShare.toFixed(1)}% of the host while the ` +
            `separator reports ${state.reported}% — the flex basis did not apply`,
        );
      }
      if (!state.sideBySide) {
        problems.push('the panels and the separator are not laid out side by side');
      }
      if (Math.abs(state.covered - 1) > 0.02) {
        problems.push(
          `the panels and separator cover ${(state.covered * 100).toFixed(1)}% of the host — ` +
            'the second panel is not taking the rest',
        );
      }
      if (!(state.handleWidth > 0 && state.handleWidth < 20)) {
        problems.push(`the separator measured ${state.handleWidth}px`);
      }
      if (state.handleCursor !== 'col-resize') {
        problems.push(
          `the separator's cursor is "${state.handleCursor}" — the orientation did not reach it`,
        );
      }
      if (state.touchAction !== 'none') {
        problems.push(
          `the separator's touch-action is "${state.touchAction}" — a touch drag would scroll ` +
            'the page instead',
        );
      }
      if (!state.grip || state.grip === 'rgba(0, 0, 0, 0)') {
        problems.push('the grip has no colour — the --pf-resizable-grip alias did not resolve');
      }
      if (state.ringWhenBlurred !== 'none') {
        problems.push(`the separator has a ring before it is focused ("${state.ringWhenBlurred}")`);
      }
      if (state.ringWhenFocused === 'none') {
        problems.push(
          'the separator has no ring after a drag focused it — the focus ring alias did not ' +
            'resolve, or the drag did not focus it',
        );
      }
      if (Math.abs(state.draggedShare - 25) > 2) {
        problems.push(
          `after a drag to a quarter of the host the first panel takes ` +
            `${state.draggedShare.toFixed(1)}%`,
        );
      }
      if (state.handleAtPointer > 8) {
        problems.push(
          `the separator came to rest ${state.handleAtPointer.toFixed(1)}px from the pointer`,
        );
      }
      if (state.echo !== '25') {
        problems.push(`pf-resizable reported "${state.echo}" to the host framework`);
      }
    }
  }

  /*
   * The uploader, and the one thing no test project can check: that it is a
   * real form control in a real build. Plus the dropzone's layout and the
   * dashed border a person reads as "drop here", and the dropped file's
   * journey all the way out to the host framework's own state.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-file-uploader');
        if (!el) return { error: 'the consumer app has no pf-file-uploader' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const rows = () => [...el.shadowRoot.querySelectorAll('[part="file"]')];
        const picker = el.shadowRoot.querySelector('input[type=file]');
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const zone = part('dropzone');
        const read = {
          hint: zone.textContent.trim(),
          // The dashed border is the affordance; a solid one reads as a box.
          borderStyle: getComputedStyle(zone).borderTopStyle,
          zoneWidth: zone.getBoundingClientRect().width,
          hostWidth: el.getBoundingClientRect().width,
          // The input is out of sight but not `display: none` — a
          // display-none file input cannot be opened with .click() everywhere.
          pickerDisplay: getComputedStyle(picker).display,
          pickerBox: picker.getBoundingClientRect().width,
          iconDrawn: getComputedStyle(part('icon')).display !== 'none',
          /*
           * The only place this can be checked: a form-associated element's
           * submission comes from ElementInternals, which neither Vitest
           * project provides.
           */
          emptySubmission: (() => {
            const form = document.createElement('form');
            el.parentElement.insertBefore(form, el);
            form.appendChild(el);
            const has = new FormData(form).has('docs');
            form.parentElement.insertBefore(el, form);
            form.remove();
            return has;
          })(),
        };

        // A real drop, carrying a real File.
        const data = new DataTransfer();
        data.items.add(new File(['hello'], 'brief.pdf', { type: 'application/pdf' }));
        zone.dispatchEvent(
          new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }),
        );

        const echo = () =>
          document.querySelector('[data-testid="file-uploader-count"]')?.textContent?.trim();
        const deadline = Date.now() + 3000;
        while (echo() !== '1') {
          if (Date.now() > deadline)
            return { ...read, echo: echo(), error: 'the drop never echoed' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await settle();

        const form = document.createElement('form');
        el.parentElement.insertBefore(form, el);
        form.appendChild(el);
        const submitted = [...new FormData(form).getAll('docs')].map((entry) => entry.name);
        form.parentElement.insertBefore(el, form);
        form.remove();

        const row = rows()[0];
        const name = row.querySelector('.file-name') ?? row;
        const remove = row.querySelector('[part="remove"]');

        return {
          ...read,
          echo: echo(),
          submitted,
          rowText: row.textContent.replace(/\s+/g, ' ').trim(),
          // The name takes the slack, so the remove button sits at the edge.
          removeGap: row.getBoundingClientRect().right - remove.getBoundingClientRect().right,
          nameTruncates: getComputedStyle(name).textOverflow,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-file-uploader: ${state.error}`);
    } else {
      if (!state.hint.includes('Accepted: .pdf,image/* | Max size: 1.0 MB | Max files: 3')) {
        problems.push(`the dropzone's hint reads "${state.hint}"`);
      }
      if (state.borderStyle !== 'dashed') {
        problems.push(
          `the dropzone's border is "${state.borderStyle}" — the dashed affordance is missing`,
        );
      }
      if (Math.abs(state.zoneWidth - state.hostWidth) > 2) {
        problems.push(
          `the dropzone measured ${state.zoneWidth}px in a ${state.hostWidth}px host — it does ` +
            'not fill the field',
        );
      }
      if (state.pickerDisplay === 'none') {
        problems.push(
          'the file input is display:none, which cannot be opened with .click() in every browser',
        );
      }
      if (state.pickerBox > 2) {
        problems.push(`the file input takes ${state.pickerBox}px of layout`);
      }
      if (!state.iconDrawn) {
        problems.push('the dropzone icon did not draw');
      }
      if (state.emptySubmission) {
        problems.push('an empty uploader was present in the submission — it should be absent');
      }
      if (state.submitted.join() !== 'brief.pdf') {
        problems.push(
          `the form submitted ${JSON.stringify(state.submitted)} — expected the dropped file`,
        );
      }
      if (!state.rowText.includes('brief.pdf') || !state.rowText.includes('5 B')) {
        problems.push(`the file row reads "${state.rowText}"`);
      }
      if (state.removeGap > 20) {
        problems.push(
          `the remove button sits ${state.removeGap.toFixed(1)}px from the row's edge — the ` +
            'name is not taking the slack',
        );
      }
      if (state.nameTruncates !== 'ellipsis') {
        problems.push(`a long file name would not truncate ("${state.nameTruncates}")`);
      }
      if (state.echo !== '1') {
        problems.push(`pf-file-uploader reported "${state.echo}" files to the host framework`);
      }
    }
  }

  /*
   * The snippet, whose layout is the thing: a gutter that lines up under
   * itself, a code block that really scrolls at its maximum height, and the
   * `color-mix` chain that tints the header and borders from the one
   * `--pf-code-snippet-bg` — none of which a test project can see, because
   * `color-mix` has to resolve against a real background.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-code-snippet');
        if (!el) return { error: 'the consumer app has no pf-code-snippet' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const numbers = () => [...el.shadowRoot.querySelectorAll('[part="line-number"]')];
        for (let i = 0; i < 4; i += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        const pre = part('pre');
        const header = part('header');
        const figure = part('figure');
        const gutter = numbers();

        return {
          lineCount: gutter.length,
          // The gutter is one column: every number's right edge is the same.
          gutterAligned:
            new Set(gutter.map((node) => Math.round(node.getBoundingClientRect().right))).size ===
            1,
          // The numbers sit left of the code they number.
          numberBeforeContent: (() => {
            const content = el.shadowRoot.querySelector('.line-content');
            return (
              gutter[0].getBoundingClientRect().right <= content.getBoundingClientRect().left + 1
            );
          })(),
          maxHeight: getComputedStyle(pre).maxHeight,
          mono: getComputedStyle(pre).fontFamily,
          // The color-mix chain: header and border tinted from the one bg.
          figureBg: getComputedStyle(figure).backgroundColor,
          headerBg: getComputedStyle(header).backgroundColor,
          borderColor: getComputedStyle(figure).borderTopColor,
          numberColor: getComputedStyle(gutter[0]).color,
          codeColor: getComputedStyle(el.shadowRoot.querySelector('.line-content')).color,
          // The live region is present and silent until something happens.
          status: el.shadowRoot.getElementById('status')?.textContent,
          statusHidden: el.shadowRoot.getElementById('status')?.getBoundingClientRect().width <= 1,
          copyLabel: part('copy').textContent.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-code-snippet: ${state.error}`);
    } else {
      if (state.lineCount !== 3) {
        problems.push(`the gutter numbered ${state.lineCount} lines, expected 3`);
      }
      if (!state.gutterAligned) {
        problems.push('the line numbers are not in one column');
      }
      if (!state.numberBeforeContent) {
        problems.push('a line number is not left of the code it numbers');
      }
      if (state.maxHeight !== '160px') {
        problems.push(`the code block's max-height is "${state.maxHeight}", expected 160px`);
      }
      if (!state.mono.toLowerCase().includes('mono')) {
        problems.push(`the code is set in "${state.mono}" — the mono token did not resolve`);
      }
      /*
       * Both halves: the same colour means the mix did not tint, and no
       * colour at all means the declaration died — which is what an
       * unresolved `color-mix` or a missing `--pf-mix-base` looks like.
       */
      if (state.figureBg === state.headerBg) {
        problems.push(
          `the header is the same colour as the block ("${state.headerBg}") — the color-mix ` +
            'chain did not tint it',
        );
      }
      if (!state.headerBg || state.headerBg === 'rgba(0, 0, 0, 0)') {
        problems.push('the header has no background — the color-mix chain did not resolve');
      }
      if (!state.borderColor || state.borderColor === 'rgba(0, 0, 0, 0)') {
        problems.push('the frame has no border colour — the color-mix chain did not resolve');
      }
      if (state.numberColor === state.codeColor) {
        problems.push(`the line numbers are the same colour as the code ("${state.codeColor}")`);
      }
      if (state.status !== '') {
        problems.push(`the live region already says "${state.status}"`);
      }
      if (!state.statusHidden) {
        problems.push('the live region takes up layout — its .sr-only copy is missing');
      }
      if (state.copyLabel !== 'Copy') {
        problems.push(`the copy button reads "${state.copyLabel}"`);
      }
    }
  }

  /*
   * The editor, and the four things only a real build shows: the placeholder,
   * which is a `::before` on `:empty` and so needs both the stylesheet and a
   * genuinely empty box; `min-height` reaching the editable area through a
   * custom property set inline on it; the focus ring landing on the *box*
   * rather than on the editable area, via `:focus-within`; and the browser's
   * own paragraph margins, which are styled by a plain descendant selector
   * because the content lives in the shadow root rather than being slotted.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-rich-text-editor');
        if (!el) return { error: 'the consumer app has no pf-rich-text-editor' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const editor = part('editor');
        const box = editor.parentElement;
        const tools = [...el.shadowRoot.querySelectorAll('[part="tool"]')];

        const read = {
          minHeight: getComputedStyle(editor).minHeight,
          /*
           * The consumer's value is two paragraphs, which core keeps — a
           * single wrapping one is stripped, and would leave no `<p>` here at
           * all. The first run of this check used one and found exactly that.
           */
          paragraphMargins: (() => {
            const all = [...editor.querySelectorAll('p')];
            if (all.length < 2) return null;
            /*
             * The *last* paragraph's margin is the one we own: `p` has a
             * margin in the UA stylesheet, so checking the first one passes
             * with our rule deleted. `p:last-child { margin-bottom: 0 }` has
             * no UA equivalent.
             */
            return {
              first: getComputedStyle(all[0]).marginBottom,
              last: getComputedStyle(all[all.length - 1]).marginBottom,
            };
          })(),
          toolbarBelowNothing:
            Math.round(part('toolbar').getBoundingClientRect().bottom) <=
            Math.round(editor.getBoundingClientRect().top) + 1,
          toolbarTinted: getComputedStyle(part('toolbar')).backgroundColor,
          boxBg: getComputedStyle(box).backgroundColor,
          dividerWidth: el.shadowRoot.querySelector('.divider')?.getBoundingClientRect().width,
          tabStops: tools.filter((button) => button.tabIndex === 0).length,
          countAlignment: getComputedStyle(part('count')).textAlign,
          ringWhenBlurred: getComputedStyle(box).boxShadow,
        };

        tools[0].focus();
        await settle();
        const ringWhenFocused = getComputedStyle(box).boxShadow;

        /*
         * The placeholder: a `::before` on `:empty`, so the box has to be
         * emptied for real before it can be measured. Its width is the only
         * way to see it, since pseudo-element content has no box of its own
         * to query.
         */
        editor.innerHTML = '';
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await settle();
        const placeholder = getComputedStyle(editor, '::before').content;
        const emptyWidth = editor.getBoundingClientRect().width;

        // Type something and watch it reach the host framework.
        editor.innerHTML = 'typed <strong>here</strong>';
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));

        const echo = () =>
          document.querySelector('[data-testid="rich-text-length"]')?.textContent?.trim();
        const deadline = Date.now() + 3000;
        while (echo() !== String('typed <strong>here</strong>'.length)) {
          if (Date.now() > deadline)
            return { ...read, echo: echo(), error: 'the edit never echoed' };
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await settle();

        return {
          ...read,
          ringWhenFocused,
          placeholder,
          emptyWidth,
          echo: echo(),
          count: part('count').textContent.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-rich-text-editor: ${state.error}`);
    } else {
      if (state.minHeight !== '120px') {
        problems.push(
          `the editable area's min-height is "${state.minHeight}", expected the 120px the ` +
            'consumer asked for',
        );
      }
      if (state.paragraphMargins === null) {
        problems.push("the consumer's two-paragraph value left fewer than two in the editor");
      } else {
        if (state.paragraphMargins.first === '0px') {
          problems.push(
            "the browser's own paragraphs have no margin — the descendant rule did not apply",
          );
        }
        if (state.paragraphMargins.last !== '0px') {
          problems.push(
            `the last paragraph still has ${state.paragraphMargins.last} below it — the ` +
              'p:last-child rule did not apply',
          );
        }
      }
      if (!state.toolbarBelowNothing) {
        problems.push('the toolbar is not above the editable area');
      }
      if (state.toolbarTinted === state.boxBg) {
        problems.push(
          `the toolbar is the same colour as the field ("${state.boxBg}") — the subtle ` +
            'background did not resolve',
        );
      }
      // And the other half: transparent is not "different", it is missing.
      if (!state.toolbarTinted || state.toolbarTinted === 'rgba(0, 0, 0, 0)') {
        problems.push('the toolbar has no background of its own');
      }
      if (!(state.dividerWidth > 0)) {
        problems.push(`the toolbar divider measured ${state.dividerWidth}px`);
      }
      if (state.tabStops !== 1) {
        problems.push(
          `the toolbar has ${state.tabStops} tab stops — the roving tabindex did not apply`,
        );
      }
      if (state.countAlignment !== 'end' && state.countAlignment !== 'right') {
        problems.push(`the counter is aligned "${state.countAlignment}"`);
      }
      if (state.ringWhenBlurred !== 'none') {
        problems.push(`the field has a ring before anything inside it is focused`);
      }
      if (state.ringWhenFocused === 'none') {
        problems.push(
          'focusing a toolbar button drew no ring on the field — :focus-within or the ring ' +
            'alias did not resolve',
        );
      }
      if (!state.placeholder || state.placeholder === 'none') {
        problems.push(
          `an emptied editor shows no placeholder (content: ${state.placeholder}) — the ` +
            ':empty::before rule did not apply',
        );
      }
      if (!(state.emptyWidth > 0)) {
        problems.push('the emptied editor collapsed to nothing');
      }
      // The counter follows the *text*, so 'typed here' is 10, not the 27 of
      // the markup that carries it.
      if (state.count !== '10/200') {
        problems.push(`the counter reads "${state.count}" after typing 10 characters of text`);
      }
      if (state.echo !== String('typed <strong>here</strong>'.length)) {
        problems.push(`pf-rich-text-editor reported "${state.echo}" to the host framework`);
      }
    }
  }

  /*
   * The sparkline, and the two things no test project can see. Neither
   * applies `styleUrl` CSS, so `getAnimations()` there is empty whether the
   * shadow-root copy of the `@keyframes` exists or not — which is exactly the
   * failure this check is for, since keyframes do not cross a shadow
   * boundary. And the area's own opacity, which is what makes the fill read
   * as a tint rather than as a block.
   */
  {
    const state = await page
      .evaluate(async () => {
        const chart = (testid) => document.querySelector(`[data-testid="${testid}"]`);
        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const still = chart('sparkline');
        const area = chart('sparkline-area');
        const flat = chart('sparkline-flat');
        if (!still || !area || !flat)
          return { error: 'the consumer app is missing a pf-sparkline' };

        const line = part(area, 'line');
        const fill = part(area, 'area');

        // Wait for the draw-in to start rather than sampling for it.
        const deadline = Date.now() + 3000;
        let running = line.getAnimations();
        while (running.length === 0 && Date.now() < deadline) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          running = line.getAnimations();
        }

        const read = {
          lineAnimationName: getComputedStyle(line).animationName,
          lineAnimationDuration: getComputedStyle(line).animationDuration,
          lineAnimationsRunning: running.length,
          areaAnimationsRunning: fill.getAnimations().length,
          stillAnimations: part(still, 'line').getAnimations().length,
          // The stroke colour comes from the token, read on the path itself.
          strokeColor: getComputedStyle(part(still, 'line')).stroke,
          dotColor: getComputedStyle(part(still, 'dot')).fill,
        };

        await Promise.all([
          ...line.getAnimations().map((animation) => animation.finished),
          ...fill.getAnimations().map((animation) => animation.finished),
        ]);
        await settle();

        return {
          ...read,
          // After the fade the fill sits at its own opacity, not at 1.
          areaOpacity: Number(getComputedStyle(fill).opacity),
          // The dash offset is back to zero, so the whole line is drawn.
          dashOffset: getComputedStyle(line).strokeDashoffset,
          // A flat series is centred: its box is a line across the middle.
          flatBox: (() => {
            const path = part(flat, 'line');
            const box = path.getBBox();
            const host = flat.getBoundingClientRect();
            return { top: box.y, height: box.height, hostHeight: host.height };
          })(),
          named: part(still, 'svg').getAttribute('role'),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-sparkline: ${state.error}`);
    } else {
      if (state.lineAnimationName !== 'pf-sparkline-draw') {
        problems.push(
          `the line's animation-name computes to "${state.lineAnimationName}" — an undefined ` +
            'duration token would make the whole shorthand invalid',
        );
      }
      if (state.lineAnimationDuration === '0s') {
        problems.push("the line's animation-duration computes to 0s");
      }
      /*
       * The one check that sees a missing `@keyframes` copy: the name and the
       * duration both read correctly in that case and nothing runs.
       */
      if (state.lineAnimationsRunning === 0) {
        problems.push(
          'the line declared an animation and ran none — the shadow root has no copy of the ' +
            'keyframes',
        );
      }
      if (state.areaAnimationsRunning === 0) {
        problems.push('the area declared a fade and ran none');
      }
      if (state.stillAnimations !== 0) {
        problems.push(
          `a sparkline with no "animated" attribute ran ${state.stillAnimations} animations`,
        );
      }
      if (!state.strokeColor || state.strokeColor === 'none') {
        problems.push('the line has no stroke colour — the token did not resolve');
      }
      if (state.dotColor !== state.strokeColor) {
        problems.push(
          `the end dot is "${state.dotColor}" against the line's "${state.strokeColor}"`,
        );
      }
      if (!(state.areaOpacity > 0 && state.areaOpacity < 1)) {
        problems.push(
          `the area settled at opacity ${state.areaOpacity} — the fade should end at the ` +
            'tint the stylesheet gives it, not at 1',
        );
      }
      if (Number.parseFloat(state.dashOffset) !== 0) {
        problems.push(`the line settled at stroke-dashoffset ${state.dashOffset}`);
      }
      if (state.flatBox.height > 2) {
        problems.push(
          `a flat series drew a box ${state.flatBox.height}px tall — it is not one line`,
        );
      }
      if (Math.abs(state.flatBox.top - state.flatBox.hostHeight / 2) > 2) {
        problems.push(
          `a flat series sits at y=${state.flatBox.top} in a ${state.flatBox.hostHeight}px box ` +
            '— it is not centred',
        );
      }
      if (state.named !== 'img') {
        problems.push(`a named sparkline has role "${state.named}", expected img`);
      }
    }
  }

  /*
   * The gauge and the pie. Both are almost entirely CSS that no test project
   * applies: the gauge's arc fills in from a `@keyframes` copy that has to
   * exist inside its shadow root, and the pie's wedges are a
   * `conic-gradient` masked by a **registered** custom property — without
   * `@property` the mask cannot interpolate and the sweep jumps rather than
   * sweeping. Whether `@property` registers from inside a shadow root at all
   * is the measurement this block exists for.
   */
  {
    const state = await page
      .evaluate(async () => {
        const gauge = document.querySelector('pf-gauge-chart');
        const pie = document.querySelector('pf-pie-chart');
        if (!gauge || !pie) return { error: 'the consumer app is missing a chart' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const slice = (testid) => document.querySelector(`[data-testid="${testid}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const fill = part(gauge, 'fill');
        const layer = part(pie, 'gradient');

        /*
         * Both of these are *entrance* animations with no fill mode, and by
         * the time the smoke reaches this block they finished seconds ago —
         * `getAnimations()` reports nothing for a finished animation that is
         * no longer in effect, so waiting for them here would wait forever.
         * Restarting them is the only way to observe them: clearing and
         * restoring the inline `animation`, with a forced reflow between,
         * makes the browser run them again. (The sparkline's survived the
         * same check only because it is declared `both`, which keeps a
         * finished animation in effect.)
         */
        const restart = async (node) => {
          node.style.animation = 'none';
          /*
           * A frame between the two assignments, not `void node.offsetWidth`:
           * `offsetWidth` is `undefined` on an SVG element, so the usual
           * force-a-reflow idiom reads as a no-op there and the browser never
           * sees the intermediate state — measured, by watching this check
           * report "ran none" against an element whose keyframes were
           * demonstrably present and whose duration computed to 0.28s.
           */
          await new Promise((resolve) => requestAnimationFrame(resolve));
          node.style.animation = '';
        };
        await restart(fill);
        await restart(layer);

        const deadline = Date.now() + 3000;
        let fillRunning = fill.getAnimations();
        let sweepRunning = layer.getAnimations();
        while ((fillRunning.length === 0 || sweepRunning.length === 0) && Date.now() < deadline) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          fillRunning = fill.getAnimations();
          sweepRunning = layer.getAnimations();
        }

        const read = {
          fillAnimationName: getComputedStyle(fill).animationName,
          fillAnimationsRunning: fillRunning.length,
          sweepAnimationName: getComputedStyle(layer).animationName,
          sweepAnimationsRunning: sweepRunning.length,
          /*
           * The registered property: an unregistered custom property computes
           * to its token stream verbatim and cannot interpolate, so this
           * reading is how we know `@property` took effect from a shadow
           * stylesheet.
           */
          sweepComputed: getComputedStyle(layer).getPropertyValue('--pf-pie-sweep').trim(),
          gaugeTrack: getComputedStyle(part(gauge, 'track')).stroke,
          gaugeFill: getComputedStyle(fill).stroke,
          // The arc is rotated to start at twelve o'clock.
          gaugeTransform: getComputedStyle(fill).transform,
          // The label sits over the arc, not beside it.
          labelCentred: (() => {
            const host = gauge.getBoundingClientRect();
            const centre = part(gauge, 'center').getBoundingClientRect();
            return (
              Math.abs(centre.left + centre.width / 2 - (host.left + host.width / 2)) < 2 &&
              Math.abs(centre.top + centre.height / 2 - (host.top + host.height / 2)) < 2
            );
          })(),
          // The sub-label is slotted with no wrapper, so it costs no gap.
          subLabelColour: getComputedStyle(gauge.querySelector('[slot="sub"]')).color,
          labelColour: getComputedStyle(part(gauge, 'label')).color,
        };

        await Promise.all([
          ...fill.getAnimations().map((animation) => animation.finished),
          ...layer.getAnimations().map((animation) => animation.finished),
        ]);
        await settle();

        return {
          ...read,
          gradientImage: getComputedStyle(layer).backgroundImage,
          sweepSettled: getComputedStyle(layer).getPropertyValue('--pf-pie-sweep').trim(),
          // A slice of zero is not a legend row.
          emptySliceDisplay: getComputedStyle(slice('pie-slice-empty')).display,
          drawnSliceDisplay: getComputedStyle(slice('pie-slice-1')).display,
          // The three drawn slices print shares that add up.
          shares: ['pie-slice-1', 'pie-slice-2', 'pie-slice-3'].map((id) =>
            Number.parseInt(part(slice(id), 'value').textContent, 10),
          ),
          swatches: ['pie-slice-1', 'pie-slice-2', 'pie-slice-3'].map(
            (id) => getComputedStyle(part(slice(id), 'dot')).backgroundColor,
          ),
          // The hole is a real hole: its own background over the gradient.
          holeBackground: getComputedStyle(part(pie, 'center')).backgroundColor,
          holeSize: part(pie, 'center').getBoundingClientRect().width,
          chartSize: part(pie, 'visual').getBoundingClientRect().width,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`charts: ${state.error}`);
    } else {
      if (state.fillAnimationName !== 'pf-gauge-fill') {
        problems.push(`the gauge's animation-name computes to "${state.fillAnimationName}"`);
      }
      if (state.fillAnimationsRunning === 0) {
        problems.push(
          'the gauge declared an animation and ran none — its shadow root has no copy of the ' +
            'keyframes',
        );
      }
      if (state.sweepAnimationName !== 'pf-pie-sweep') {
        problems.push(`the pie's animation-name computes to "${state.sweepAnimationName}"`);
      }
      if (state.sweepAnimationsRunning === 0) {
        problems.push('the pie declared a sweep and ran none');
      }
      if (!state.sweepComputed.endsWith('%')) {
        problems.push(
          `--pf-pie-sweep computed to "${state.sweepComputed}" — @property did not register ` +
            'from the shadow stylesheet, so the mask cannot interpolate',
        );
      }
      if (state.sweepSettled !== '100%') {
        problems.push(`the sweep settled at ${state.sweepSettled}, expected 100%`);
      }
      if (state.gaugeTrack === state.gaugeFill) {
        problems.push(`the gauge's track and fill are both "${state.gaugeFill}"`);
      }
      if (!state.gaugeTransform || state.gaugeTransform === 'none') {
        problems.push('the gauge arc is not rotated, so it starts at three o’clock');
      }
      if (!state.labelCentred) {
        problems.push('the gauge label is not over the middle of the arc');
      }
      if (state.subLabelColour === state.labelColour) {
        problems.push(
          `the slotted sub-label is the same colour as the big number ` +
            `("${state.labelColour}") — the ::slotted rule did not reach it`,
        );
      }
      if (!state.gradientImage.includes('conic-gradient')) {
        problems.push(`the pie's background-image is "${state.gradientImage}"`);
      }
      if (state.gradientImage.includes('NaN')) {
        problems.push('the pie gradient has a NaN stop in it');
      }
      if (state.emptySliceDisplay !== 'none') {
        problems.push(
          `a slice of zero computes to display "${state.emptySliceDisplay}" — it is a legend ` +
            'row for a wedge that does not exist',
        );
      }
      if (state.drawnSliceDisplay === 'none') {
        problems.push('a drawn slice is hidden from the legend');
      }
      if (state.shares.reduce((sum, value) => sum + value, 0) !== 100) {
        problems.push(`the legend shares ${JSON.stringify(state.shares)} do not add up to 100`);
      }
      if (new Set(state.swatches).size !== state.swatches.length) {
        problems.push(
          `two slices share a swatch colour (${JSON.stringify(state.swatches)}) — the palette ` +
            'did not advance',
        );
      }
      if (!state.holeBackground || state.holeBackground === 'rgba(0, 0, 0, 0)') {
        problems.push('the pie has no hole — its centre is transparent over the gradient');
      }
      if (!(state.holeSize > 0 && state.holeSize < state.chartSize)) {
        problems.push(`the hole measured ${state.holeSize}px in a ${state.chartSize}px chart`);
      }
    }
  }

  /*
   * The heatmap, whose shape is entirely CSS grid: seven fixed rows filled
   * top to bottom and then left to right, which no test project can see.
   * Plus the `color-mix` scale — a mix has to resolve against a real
   * background — and the staggered entrance, whose `@keyframes` need a copy
   * inside this shadow root.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-heatmap');
        if (!el) return { error: 'the consumer app has no pf-heatmap' };

        const part = (name) => el.shadowRoot.querySelector(`[part="${name}"]`);
        const cells = [...el.shadowRoot.querySelectorAll('[part="cell"]')];
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const grid = part('grid');
        const boxes = cells.map((cell) => cell.getBoundingClientRect());
        const rows = new Set(boxes.map((box) => Math.round(box.top)));
        const columns = new Set(boxes.map((box) => Math.round(box.left)));

        const levelColour = (level) => {
          const cell = cells.find((node) => node.getAttribute('data-level') === String(level));
          return cell ? getComputedStyle(cell).backgroundColor : null;
        };

        /*
         * The entrance animation has no fill mode and finished long before
         * this block runs, so it has to be restarted to be seen — and with a
         * frame between the two assignments, since these are real HTML
         * elements but the idiom is the same one the charts need.
         */
        const first = cells[0];
        first.style.animation = 'none';
        await new Promise((resolve) => requestAnimationFrame(resolve));
        first.style.animation = '';

        const deadline = Date.now() + 3000;
        let running = first.getAnimations();
        while (running.length === 0 && Date.now() < deadline) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          running = first.getAnimations();
        }

        return {
          cellCount: cells.length,
          rowCount: rows.size,
          columnCount: columns.size,
          // Columns fill downward: the second cell is below the first.
          fillsDownward: boxes[1].top > boxes[0].top && Math.abs(boxes[1].left - boxes[0].left) < 1,
          cellSize: Math.round(boxes[0].width),
          cellGap: Math.round(boxes[1].top - boxes[0].bottom),
          gridWidth: grid.getBoundingClientRect().width,
          // The mix: every level a different colour, and all of them real.
          colours: [0, 1, 2, 4].map(levelColour),
          animationName: getComputedStyle(first).animationName,
          animationsRunning: running.length,
          // The labels sit beside and above the grid.
          weekdaysLeft:
            part('weekdays').getBoundingClientRect().right <= grid.getBoundingClientRect().left + 1,
          monthsAbove:
            part('months').getBoundingClientRect().bottom <= grid.getBoundingClientRect().top + 1,
          monthCount: el.shadowRoot.querySelectorAll('.month').length,
          label: el.getAttribute('aria-label'),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-heatmap: ${state.error}`);
    } else {
      if (state.cellCount !== 61) {
        problems.push(`the heatmap drew ${state.cellCount} cells for 61 days`);
      }
      if (state.rowCount !== 7) {
        problems.push(
          `the cells landed on ${state.rowCount} rows — the seven fixed grid rows did not apply`,
        );
      }
      if (state.columnCount < 9) {
        problems.push(
          `the cells landed in ${state.columnCount} columns, too few for nine weeks — the grid ` +
            'is not flowing by column',
        );
      }
      if (!state.fillsDownward) {
        problems.push('the grid fills across rather than down, so a row is not one weekday');
      }
      if (state.cellSize !== 12) {
        problems.push(
          `a cell measured ${state.cellSize}px — the --pf-heatmap-cell-size the consumer set ` +
            'did not reach it',
        );
      }
      if (state.cellGap !== 3) {
        problems.push(`the gap between cells measured ${state.cellGap}px, expected 3`);
      }
      if (state.colours.some((colour) => !colour || colour === 'rgba(0, 0, 0, 0)')) {
        problems.push(
          `a level has no colour (${JSON.stringify(state.colours)}) — the color-mix scale did ` +
            'not resolve',
        );
      }
      if (new Set(state.colours).size !== state.colours.length) {
        problems.push(
          `two levels share a colour (${JSON.stringify(state.colours)}) — the scale is flat`,
        );
      }
      if (state.animationName !== 'pf-heatmap-cell-in') {
        problems.push(`the cells' animation-name computes to "${state.animationName}"`);
      }
      if (state.animationsRunning === 0) {
        problems.push(
          'the cells declared an animation and ran none — the shadow root has no copy of the ' +
            'keyframes',
        );
      }
      if (!state.weekdaysLeft) {
        problems.push('the weekday labels are not to the left of the grid');
      }
      if (!state.monthsAbove) {
        problems.push('the month labels are not above the grid');
      }
      if (state.monthCount !== 3) {
        problems.push(`the heatmap named ${state.monthCount} months across a range spanning three`);
      }
      if (state.label !== 'Commits') {
        problems.push(`the heatmap is named "${state.label}"`);
      }
    }
  }

  /*
   * The radar, whose geometry a test project can read off the `points`
   * attributes but whose *layout* it cannot: the names are drawn outside the
   * rings, so the SVG has to be `overflow: visible` or they are clipped away
   * — and the grow-from-the-centre animation needs `transform-box: view-box`
   * or it scales about the value polygon's own bounding box, which moves
   * with the data.
   */
  {
    const state = await page
      .evaluate(async () => {
        const el = document.querySelector('pf-radar-chart');
        if (!el) return { error: 'the consumer app has no pf-radar-chart' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const parts = (host, name) => [...host.shadowRoot.querySelectorAll(`[part="${name}"]`)];
        const axis = (testid) => document.querySelector(`[data-testid="${testid}"]`);
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const svg = part(el, 'svg');
        const group = el.shadowRoot.querySelector('.value');
        const labels = parts(el, 'axis-label');
        const area = part(el, 'area');
        const rings = parts(el, 'grid');

        // Restart the entrance animation; it has no fill mode and is over.
        group.style.animation = 'none';
        await new Promise((resolve) => requestAnimationFrame(resolve));
        group.style.animation = '';

        const deadline = Date.now() + 3000;
        let running = group.getAnimations();
        while (running.length === 0 && Date.now() < deadline) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          running = group.getAnimations();
        }

        const svgBox = svg.getBoundingClientRect();
        const labelBoxes = labels.map((label) => label.getBoundingClientRect());

        return {
          overflow: getComputedStyle(svg).overflow,
          /*
           * The origin, not `transform-box`: the latter's initial value is
           * already `view-box` in current browsers, so asserting it proves
           * nothing — measured, by removing the declaration and watching the
           * check stay green. The origin is what the element actually
           * decides, and the animation grows from the wrong place without it.
           */
          transformOrigin: getComputedStyle(group).transformOrigin,
          animationName: getComputedStyle(group).animationName,
          animationsRunning: running.length,
          labelCount: labels.length,
          // The names are drawn outside the outermost ring.
          namesOutsideRings: (() => {
            const ring = rings[rings.length - 1].getBoundingClientRect();
            return labelBoxes.every(
              (box) =>
                box.left < ring.left ||
                box.right > ring.right ||
                box.top < ring.top ||
                box.bottom > ring.bottom,
            );
          })(),
          // And they are visible: a clipped name measures nothing.
          namesHaveSize: labelBoxes.every((box) => box.width > 0 && box.height > 0),
          svgWidth: svgBox.width,
          areaFill: getComputedStyle(area).fill,
          areaStroke: getComputedStyle(area).stroke,
          pointFill: getComputedStyle(part(el, 'point')).fill,
          gridStroke: getComputedStyle(rings[0]).stroke,
          droppedDisplay: getComputedStyle(axis('radar-axis-dropped')).display,
          drawnDisplay: getComputedStyle(axis('radar-axis-1')).display,
          legendValue: part(axis('radar-axis-1'), 'value').textContent.trim(),
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`pf-radar-chart: ${state.error}`);
    } else {
      if (state.overflow !== 'visible') {
        problems.push(
          `the radar's svg overflow is "${state.overflow}" — the names drawn outside the rings ` +
            'would be clipped',
        );
      }
      // size 240 → centre 120, so the group grows about 120px 120px.
      if (!state.transformOrigin.startsWith('120px 120px')) {
        problems.push(
          `the value group's transform-origin is "${state.transformOrigin}" — the grow ` +
            "animation does not scale about the chart's centre",
        );
      }
      if (state.animationName !== 'pf-radar-grow') {
        problems.push(`the radar's animation-name computes to "${state.animationName}"`);
      }
      if (state.animationsRunning === 0) {
        problems.push(
          'the radar declared an animation and ran none — the shadow root has no copy of the ' +
            'keyframes',
        );
      }
      if (state.labelCount !== 4) {
        problems.push(`the radar drew ${state.labelCount} names for four usable axes`);
      }
      if (!state.namesOutsideRings) {
        problems.push('a name is drawn inside the outermost ring rather than around it');
      }
      if (!state.namesHaveSize) {
        problems.push('a name measured nothing — it was clipped or never drawn');
      }
      if (!(state.svgWidth > 0)) {
        problems.push(`the radar's svg measured ${state.svgWidth}px`);
      }
      if (!state.areaFill || state.areaFill === 'none') {
        problems.push('the value polygon has no fill — the --pf-radar-fill mix did not resolve');
      }
      if (state.areaFill === state.areaStroke) {
        problems.push(
          `the polygon's fill and stroke are both "${state.areaFill}" — the fill should be the ` +
            'translucent mix',
        );
      }
      if (state.pointFill !== state.areaStroke) {
        problems.push(
          `a vertex is "${state.pointFill}" against the outline's "${state.areaStroke}"`,
        );
      }
      if (state.gridStroke === state.areaStroke) {
        problems.push('the grid is the same colour as the value outline');
      }
      if (state.droppedDisplay !== 'none') {
        problems.push(
          `an axis the chart did not draw computes to display "${state.droppedDisplay}" — it is ` +
            'a legend row for a spoke that does not exist',
        );
      }
      if (state.drawnDisplay === 'none') {
        problems.push('a drawn axis is hidden from the legend');
      }
      if (state.legendValue !== '9') {
        problems.push(`the first legend row reads "${state.legendValue}"`);
      }
    }
  }

  /*
   * The two cartesian charts. Their numbers are core's and the fast project
   * checks them; what only a build shows is the layout — the SVG scaling to
   * the host's width while the viewBox stays fixed, the legend's start edge
   * lined up with the plot area through an inline custom property, the y-axis
   * label drawn *outside* the plot and so needing `overflow: visible`, and
   * the dots that appear only on hover.
   */
  {
    const state = await page
      .evaluate(async () => {
        const line = document.querySelector('pf-line-chart');
        const bar = document.querySelector('pf-bar-chart');
        if (!line || !bar) return { error: 'the consumer app is missing a cartesian chart' };

        const part = (host, name) => host.shadowRoot.querySelector(`[part="${name}"]`);
        const parts = (host, name) => [...host.shadowRoot.querySelectorAll(`[part="${name}"]`)];
        const settle = async () => {
          for (let i = 0; i < 4; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        };
        await settle();

        const svg = part(line, 'svg');
        const legend = part(line, 'legend');
        const axisLabel = line.shadowRoot.querySelector('.axis-label');
        const dot = part(line, 'dot');

        const hostBox = line.getBoundingClientRect();
        const svgBox = svg.getBoundingClientRect();
        const plotLeft = Number.parseFloat(
          getComputedStyle(line).getPropertyValue('--pf-chart-plot-inset-left'),
        );

        return {
          // The SVG fills the host and keeps its aspect from the viewBox.
          svgWidth: svgBox.width,
          hostWidth: hostBox.width,
          viewBox: svg.getAttribute('viewBox'),
          overflow: getComputedStyle(svg).overflow,
          // The y-axis label is rotated outside the plot, so it must not clip.
          axisLabelVisible: (() => {
            const box = axisLabel.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          })(),
          axisLabelLeftOfPlot:
            axisLabel.getBoundingClientRect().left <
            part(line, 'grid').getBoundingClientRect().left,
          // The legend starts where the plot does.
          legendInset: Number.parseFloat(getComputedStyle(legend).paddingInlineStart),
          plotInsetPercent: plotLeft,
          legendVisible: getComputedStyle(legend).display !== 'none',
          legendRows: [...line.querySelectorAll('pf-chart-series')].map(
            (row) => getComputedStyle(row).display,
          ),
          swatches: [...line.querySelectorAll('pf-chart-series')].map(
            (row) => getComputedStyle(part(row, 'dot')).backgroundColor,
          ),
          // The dots are hidden until the chart is hovered.
          dotOpacity: getComputedStyle(dot).opacity,
          dashed: parts(line, 'line')[1].getAttribute('stroke-dasharray'),
          areaCount: parts(line, 'area').length,
          gridStroke: getComputedStyle(part(line, 'grid')).stroke,
          tickFill: getComputedStyle(part(line, 'tick')).fill,
          // The bars sit on the plot's floor and are stacked, not side by side.
          barCount: parts(bar, 'bar').length,
          barsStacked: (() => {
            const bars = parts(bar, 'bar');
            return bars[0].getAttribute('x') === bars[1].getAttribute('x');
          })(),
          barWidths: parts(bar, 'bar').map((rect) => Number(rect.getAttribute('width'))),
          barHoverTransition: getComputedStyle(parts(bar, 'bar')[0]).transitionProperty,
        };
      })
      .catch((error) => ({ error: String(error) }));

    if (state.error) {
      problems.push(`cartesian charts: ${state.error}`);
    } else {
      if (Math.abs(state.svgWidth - state.hostWidth) > 2) {
        problems.push(
          `the chart's svg measured ${state.svgWidth}px in a ${state.hostWidth}px host`,
        );
      }
      if (state.viewBox !== '0 0 560 240') {
        problems.push(`the chart's viewBox is "${state.viewBox}"`);
      }
      if (state.overflow !== 'visible') {
        problems.push(
          `the chart's svg overflow is "${state.overflow}" — the rotated y-axis label would be ` +
            'clipped',
        );
      }
      if (!state.axisLabelVisible) {
        problems.push('the y-axis label measured nothing — it was clipped or never drawn');
      }
      if (!state.axisLabelLeftOfPlot) {
        problems.push('the y-axis label is not outside the plot area');
      }
      if (!(state.plotInsetPercent > 0)) {
        problems.push('--pf-chart-plot-inset-left resolved to nothing on the host');
      }
      if (!(state.legendInset > 0)) {
        problems.push(
          `the legend's start inset is ${state.legendInset}px — it does not line up with the plot`,
        );
      }
      if (!state.legendVisible) {
        problems.push('the legend is hidden with two series and showLegend on');
      }
      if (state.legendRows.some((display) => display === 'none')) {
        problems.push('a legend row is hidden');
      }
      if (new Set(state.swatches).size !== state.swatches.length) {
        problems.push(
          `two series share a swatch colour (${JSON.stringify(state.swatches)}) — the palette ` +
            'did not advance',
        );
      }
      if (state.dotOpacity !== '0') {
        problems.push(
          `a data point's opacity is ${state.dotOpacity} at rest — the dots should appear on hover`,
        );
      }
      if (state.dashed !== '6 4') {
        problems.push(`the dashed series' stroke-dasharray is "${state.dashed}"`);
      }
      if (state.areaCount !== 2) {
        problems.push(`the area variant drew ${state.areaCount} fills for two series`);
      }
      if (state.gridStroke === state.tickFill) {
        problems.push('the gridlines and the tick labels are the same colour');
      }
      if (state.barCount !== 8) {
        problems.push(`the bar chart drew ${state.barCount} bars for four groups of two`);
      }
      if (!state.barsStacked) {
        problems.push("the stacked bar chart's bars are not in one column per group");
      }
      if (!state.barWidths.every((width) => width > 1)) {
        problems.push(`a bar measured ${Math.min(...state.barWidths)}px wide`);
      }
      if (!state.barHoverTransition.includes('opacity')) {
        problems.push(`a bar's transition-property is "${state.barHoverTransition}"`);
      }
    }
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
