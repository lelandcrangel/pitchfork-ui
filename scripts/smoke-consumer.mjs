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
  'pf-textarea',
  'pf-slider',
  'pf-radio-group',
  'pf-radio-button',
  'pf-tooltip',
  'pf-popover',
  'pf-modal',
  'pf-modal-header',
  'pf-modal-body',
  'pf-modal-footer',
  'pf-dropdown',
  'pf-context-menu',
  'pf-menu-item',
  'pf-menu-separator',
  'pf-slideout-menu',
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
      if (
        names.join(',') !==
        'at,colours,colours,due,fruit,notes,notify,plan,topics,topics,trip-end,trip-start,volume'
      ) {
        result.unstyled.push(
          `form sees [${names.join(', ')}] from the form controls, ` +
            'expected at,colours,colours,due,fruit,notes,notify,plan,topics,topics,trip-end,trip-start,volume (colours and topics twice each, one entry per value) (terms is unticked, so absent)',
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
