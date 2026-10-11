import type { ElementExample } from './ElementPreview';

/**
 * One live example per custom element, as the markup a consumer would write.
 *
 * Hand-written, and it has to be: `docs.json` records every prop, event, slot
 * and part, so the reference tables on these pages are generated — but it has
 * no idea that `pf-select` needs `pf-option` children, that a radar chart is
 * meaningless without axes, or what a sensible `data` array looks like. A
 * generated example would be `<pf-line-chart></pf-line-chart>`, which renders
 * an empty box and teaches nothing.
 *
 * Three conventions, each for a reason:
 *
 * - **A child element is shown inside its parent.** `pf-option` outside a
 *   `pf-select` has no box at all, and `pf-table-cell` outside a row lands in
 *   an anonymous one. The page is about the child, so the example centres on
 *   it, but it includes the parent it needs to exist — which is the same
 *   nesting `CHILD_OF` records in the element metadata.
 * - **An overlay is shown closed, with its trigger.** The elements here are
 *   live, so clicking the trigger really opens the panel. Forcing `open` would
 *   be worse than useless for `pf-modal`, whose `showModal()` would take over
 *   the docs page.
 * - **Markup only, wherever markup can express it.** `setup` exists for the
 *   eight props typed as an array or a function, which get no attribute from
 *   Stencil and so cannot be written in HTML at all. Using it anywhere else
 *   would hide the honest answer behind a nicer-looking preview.
 *
 * `build-elements-docs.mjs --strict` fails on an element with no entry here,
 * so a new element cannot ship with a reference page that renders nothing.
 */
export const elementExamples: Record<string, ElementExample> = {
  'pf-accordion': {
    html: `<pf-accordion style="width: 100%">
  <pf-accordion-item value="shipping">
    <span slot="title">Shipping</span>
    Dispatched within two working days.
  </pf-accordion-item>
  <pf-accordion-item value="returns">
    <span slot="title">Returns</span>
    Thirty days, unworn, with the receipt.
  </pf-accordion-item>
</pf-accordion>`,
  },

  'pf-accordion-item': {
    html: `<pf-accordion style="width: 100%">
  <pf-accordion-item value="one" expanded>
    <span slot="title">Open to start with</span>
    The panel is <code>inert</code> while closed, so Tab skips what is inside it.
  </pf-accordion-item>
  <pf-accordion-item value="two" disabled>
    <span slot="title">Disabled</span>
    Never opens.
  </pf-accordion-item>
</pf-accordion>`,
    interactive: `<pf-accordion style="width: 100%">
  <pf-accordion-item value="one" expanded>
    <span slot="title">Section</span>
    The panel is inert while closed.
  </pf-accordion-item>
</pf-accordion>`,
  },

  'pf-alert': {
    html: `<pf-alert variant="info" heading="Scheduled maintenance" style="width: 100%">
  The API will be read-only on Sunday between 02:00 and 04:00 UTC.
</pf-alert>
<pf-alert variant="danger" heading="Payment failed" dismissible style="width: 100%">
  We could not charge the card on file.
</pf-alert>`,
    interactive: `<pf-alert variant="info" heading="Scheduled maintenance" style="width: 100%">
  The API will be read-only on Sunday between 02:00 and 04:00 UTC.
</pf-alert>`,
  },

  'pf-avatar': {
    html: `<pf-avatar name="Ada Lovelace"></pf-avatar>
<pf-avatar name="Ada Lovelace" src="avatar.jpeg" alt="Ada Lovelace"></pf-avatar>
<pf-avatar name="Grace Hopper" size="lg" status="online"></pf-avatar>
<pf-avatar size="xl"></pf-avatar>`,
    interactive: `<pf-avatar name="Ada Lovelace"></pf-avatar>`,
  },

  'pf-avatar-group': {
    html: `<pf-avatar-group max="3" label="Project reviewers">
  <pf-avatar name="Ada Lovelace"></pf-avatar>
  <pf-avatar name="Grace Hopper"></pf-avatar>
  <pf-avatar name="Katherine Johnson"></pf-avatar>
  <pf-avatar name="Mary Jackson"></pf-avatar>
  <pf-avatar name="Dorothy Vaughan"></pf-avatar>
</pf-avatar-group>`,
  },

  'pf-badge': {
    html: `<pf-badge>neutral</pf-badge>
<pf-badge variant="brand">brand</pf-badge>
<pf-badge variant="success">success</pf-badge>
<pf-badge variant="warning">warning</pf-badge>
<pf-badge variant="danger">danger</pf-badge>`,
    interactive: `<pf-badge>Badge</pf-badge>`,
  },

  'pf-badge-group': {
    html: `<pf-badge-group label="New" message="Elements are here" color="brand"></pf-badge-group>
<pf-badge-group
  label="v0.2"
  message="108 elements"
  color="success"
  appearance="modern"
  badge-position="trailing"
></pf-badge-group>`,
    interactive: `<pf-badge-group label="New" message="Elements are here" color="brand"></pf-badge-group>`,
  },

  'pf-bar-chart': {
    html: `<pf-bar-chart
  label="Signups by quarter"
  y-axis-label="Signups"
  data='[["Q1", 120, 80], ["Q2", 180, 140], ["Q3", 150, 190], ["Q4", 240, 210]]'
  style="width: 100%"
>
  <pf-chart-series series-key="0" color="var(--color-brand-500)">Direct</pf-chart-series>
  <pf-chart-series series-key="1" color="var(--color-teal-500)">Referral</pf-chart-series>
</pf-bar-chart>`,
  },

  'pf-breadcrumb': {
    html: `<pf-breadcrumbs>
  <pf-breadcrumb href="#">Home</pf-breadcrumb>
  <pf-breadcrumb href="#">Components</pf-breadcrumb>
  <pf-breadcrumb current>Breadcrumb</pf-breadcrumb>
</pf-breadcrumbs>`,
    interactive: `<pf-breadcrumbs>
  <pf-breadcrumb href="#">Home</pf-breadcrumb>
  <pf-breadcrumb current>Crumb</pf-breadcrumb>
</pf-breadcrumbs>`,
  },

  'pf-breadcrumbs': {
    html: `<pf-breadcrumbs label="You are here" separator="›">
  <pf-breadcrumb href="#">Docs</pf-breadcrumb>
  <pf-breadcrumb href="#">Web components</pf-breadcrumb>
  <pf-breadcrumb>Breadcrumbs</pf-breadcrumb>
</pf-breadcrumbs>`,
  },

  'pf-button': {
    html: `<pf-button variant="primary">Save</pf-button>
<pf-button variant="secondary">Cancel</pf-button>
<pf-button variant="ghost">Skip</pf-button>
<pf-button variant="destructive">Delete</pf-button>
<pf-button variant="primary" loading>Saving</pf-button>
<pf-button variant="primary" disabled>Unavailable</pf-button>`,
    interactive: `<pf-button>Button</pf-button>`,
  },

  'pf-button-group': {
    html: `<pf-button-group value="week">
  <pf-button-group-item value="day">Day</pf-button-group-item>
  <pf-button-group-item value="week">Week</pf-button-group-item>
  <pf-button-group-item value="month">Month</pf-button-group-item>
</pf-button-group>`,
  },

  'pf-button-group-item': {
    html: `<pf-button-group value="all">
  <pf-button-group-item value="all">All</pf-button-group-item>
  <pf-button-group-item value="open" dot>Open</pf-button-group-item>
  <pf-button-group-item value="done" disabled>Done</pf-button-group-item>
</pf-button-group>`,
    interactive: `<pf-button-group value="week">
  <pf-button-group-item value="week">Week</pf-button-group-item>
  <pf-button-group-item value="month">Month</pf-button-group-item>
</pf-button-group>`,
  },

  'pf-calendar': {
    html: `<pf-calendar label="Departure date" value="2026-03-15"></pf-calendar>`,
  },

  'pf-card': {
    html: `<pf-card style="max-width: 22rem">
  <pf-card-header><strong>Monthly report</strong></pf-card-header>
  <pf-card-content>
    Three sections, each its own element. A card using only some of them still renders
    correctly.
  </pf-card-content>
  <pf-card-footer><pf-button variant="secondary" size="sm">Download</pf-button></pf-card-footer>
</pf-card>`,
  },

  'pf-card-content': {
    html: `<pf-card style="max-width: 22rem">
  <pf-card-content>The body of the card. Padding and type come from the element.</pf-card-content>
</pf-card>`,
  },

  'pf-card-footer': {
    html: `<pf-card style="max-width: 22rem">
  <pf-card-content>Anything that acts on the card goes in the footer.</pf-card-content>
  <pf-card-footer>
    <pf-button size="sm">Confirm</pf-button>
    <pf-button size="sm" variant="ghost">Dismiss</pf-button>
  </pf-card-footer>
</pf-card>`,
  },

  'pf-card-header': {
    html: `<pf-card style="max-width: 22rem">
  <pf-card-header><strong>Heading</strong></pf-card-header>
  <pf-card-content>The header carries the rule beneath it.</pf-card-content>
</pf-card>`,
  },

  'pf-carousel': {
    html: `<pf-carousel label="Release highlights" style="width: 100%; max-width: 26rem">
  <pf-carousel-slide>
    <pf-card><pf-card-content>108 custom elements</pf-card-content></pf-card>
  </pf-carousel-slide>
  <pf-carousel-slide>
    <pf-card><pf-card-content>React, Angular and Vue bindings</pf-card-content></pf-card>
  </pf-carousel-slide>
  <pf-carousel-slide>
    <pf-card><pf-card-content>One shared token sheet</pf-card-content></pf-card>
  </pf-carousel-slide>
</pf-carousel>`,
  },

  'pf-carousel-slide': {
    html: `<pf-carousel label="Two slides" style="width: 100%; max-width: 26rem">
  <pf-carousel-slide>
    <pf-card><pf-card-content>A slide off screen is <code>inert</code>, so Tab cannot reach the button in it.</pf-card-content></pf-card>
  </pf-carousel-slide>
  <pf-carousel-slide>
    <pf-card><pf-card-content><pf-button size="sm">Try tabbing to me</pf-button></pf-card-content></pf-card>
  </pf-carousel-slide>
</pf-carousel>`,
    interactive: `<pf-carousel label="One slide" style="width: 100%; max-width: 26rem">
  <pf-carousel-slide>
    <pf-card><pf-card-content>A slide</pf-card-content></pf-card>
  </pf-carousel-slide>
</pf-carousel>`,
  },

  'pf-chart-series': {
    html: `<pf-line-chart
  label="Two named series"
  data='[["Mon", 12, 8], ["Tue", 18, 11], ["Wed", 9, 14], ["Thu", 22, 16]]'
  style="width: 100%"
>
  <pf-chart-series series-key="0" color="var(--color-brand-500)">Visits</pf-chart-series>
  <pf-chart-series series-key="1" color="var(--color-amber-500)" dashed>Forecast</pf-chart-series>
</pf-line-chart>`,
    interactive: `<pf-line-chart label="One series" data='[["Mon", 12], ["Tue", 18], ["Wed", 9]]' style="width: 100%">
  <pf-chart-series series-key="0" color="var(--color-brand-500)">Visits</pf-chart-series>
</pf-line-chart>`,
  },

  'pf-checkbox': {
    html: `<pf-checkbox name="terms" label="I agree to the terms"></pf-checkbox>
<pf-checkbox name="news" label="Send me product news" checked></pf-checkbox>
<pf-checkbox name="locked" label="Unavailable" disabled></pf-checkbox>`,
    interactive: `<pf-checkbox name="terms" label="I agree to the terms"></pf-checkbox>`,
  },

  'pf-code-snippet': {
    html: `<pf-code-snippet
  heading="Install"
  language="bash"
  code="npm install @pitchfork-ui/elements"
  style="width: 100%"
></pf-code-snippet>`,
  },

  'pf-collapsible': {
    html: `<pf-collapsible style="width: 100%">
  <span slot="trigger">What changed in 0.2.0?</span>
  <p style="margin: 0">108 custom elements, and three generated binding packages.</p>
</pf-collapsible>`,
  },

  'pf-combobox': {
    html: `<pf-combobox label="City" name="city" placeholder="Start typing…" style="min-width: 16rem">
  <pf-option value="berlin">Berlin</pf-option>
  <pf-option value="lisbon">Lisbon</pf-option>
  <pf-option value="london">London</pf-option>
  <pf-option value="lusaka">Lusaka</pf-option>
</pf-combobox>`,
  },

  'pf-command-group': {
    html: `<pf-button data-open variant="secondary">Open the palette</pf-button>
<pf-command-palette label="Commands">
  <pf-command-group label="Files">
    <pf-command-item value="new">New file</pf-command-item>
    <pf-command-item value="open">Open…</pf-command-item>
  </pf-command-group>
  <pf-command-group label="View">
    <pf-command-item value="theme">Toggle theme</pf-command-item>
  </pf-command-group>
</pf-command-palette>`,
    // `open` is deliberately not set: this is a native <dialog> opened with
    // showModal(), so an open one is promoted to the top layer and covers the
    // whole docs page — measured at 0,0 1024x900, with the preview box
    // collapsed to 40px tall. Opening it from a trigger is also how a
    // consumer uses it.
    setup: (root) => {
      const palette = root.querySelector('pf-command-palette') as
        (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (palette) palette.open = true;
      });
    },
    interactive: `<pf-command-palette label="Commands" open>
  <pf-command-group label="Files">
    <pf-command-item value="new">New file</pf-command-item>
    <pf-command-item value="open">Open…</pf-command-item>
  </pf-command-group>
</pf-command-palette>`,
  },

  'pf-command-item': {
    html: `<pf-button data-open variant="secondary">Open the palette</pf-button>
<pf-command-palette label="Commands">
  <pf-command-item value="new" description="Create an empty document">New file</pf-command-item>
  <pf-command-item value="share">Share…</pf-command-item>
  <pf-command-item value="delete" disabled>Delete workspace</pf-command-item>
</pf-command-palette>`,
    // `open` is deliberately not set: this is a native <dialog> opened with
    // showModal(), so an open one is promoted to the top layer and covers the
    // whole docs page — measured at 0,0 1024x900, with the preview box
    // collapsed to 40px tall. Opening it from a trigger is also how a
    // consumer uses it.
    setup: (root) => {
      const palette = root.querySelector('pf-command-palette') as
        (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (palette) palette.open = true;
      });
    },
    interactive: `<pf-command-palette label="Commands" open>
  <pf-command-item value="new" description="Create an empty document">New file</pf-command-item>
</pf-command-palette>`,
  },

  'pf-command-palette': {
    html: `<pf-button data-open variant="secondary">Open the palette</pf-button>
<pf-command-palette label="Command palette">
  <pf-command-item value="new">New file</pf-command-item>
  <pf-command-item value="open">Open…</pf-command-item>
  <pf-command-item value="theme">Toggle theme</pf-command-item>
</pf-command-palette>`,
    // `open` is deliberately not set: this is a native <dialog> opened with
    // showModal(), so an open one is promoted to the top layer and covers the
    // whole docs page — measured at 0,0 1024x900, with the preview box
    // collapsed to 40px tall. Opening it from a trigger is also how a
    // consumer uses it.
    setup: (root) => {
      const palette = root.querySelector('pf-command-palette') as
        (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (palette) palette.open = true;
      });
    },
    interactive: `<pf-command-palette label="Command palette" open>
  <pf-command-item value="new">New file</pf-command-item>
  <pf-command-item value="open">Open…</pf-command-item>
</pf-command-palette>`,
  },

  'pf-content-divider': {
    html: `<div style="width: 100%">
  <p style="margin: 0 0 1rem">Above.</p>
  <pf-content-divider>or</pf-content-divider>
  <p style="margin: 1rem 0 0">Below.</p>
</div>`,
  },

  'pf-context-menu': {
    html: `<pf-context-menu label="Row actions">
  <pf-card style="max-width: 18rem">
    <pf-card-content>Right-click, or long-press, anywhere in this card.</pf-card-content>
  </pf-card>
  <div slot="menu">
    <pf-menu-item value="rename">Rename</pf-menu-item>
    <pf-menu-item value="duplicate">Duplicate</pf-menu-item>
    <pf-menu-separator></pf-menu-separator>
    <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
  </div>
</pf-context-menu>`,
  },

  'pf-credit-card': {
    html: `<pf-credit-card
  brand="visa"
  cardholder-name="A. LOVELACE"
  card-number="4111111111111111"
  expiry="04/29"
></pf-credit-card>`,
  },

  'pf-date-picker': {
    html: `<pf-date-picker label="Departure" name="departure" value="2026-03-15"></pf-date-picker>`,
  },

  'pf-date-range-picker': {
    html: `<pf-date-range-picker
  label="Stay"
  name="stay"
  value="2026-03-10/2026-03-20"
></pf-date-range-picker>`,
  },

  'pf-dropdown': {
    html: `<pf-dropdown label="Actions">
  <pf-button variant="secondary">Actions</pf-button>
  <div slot="menu">
    <pf-menu-item value="edit">Edit</pf-menu-item>
    <pf-menu-item value="duplicate">Duplicate</pf-menu-item>
    <pf-menu-separator></pf-menu-separator>
    <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
  </div>
</pf-dropdown>`,
  },

  'pf-empty-state': {
    html: `<pf-empty-state icon="folder-open" style="width: 100%">
  No invoices yet
  <span slot="description">Invoices appear here once the first one is issued.</span>
  <pf-button slot="action" size="sm">Create an invoice</pf-button>
</pf-empty-state>`,
  },

  'pf-file-uploader': {
    html: `<pf-file-uploader
  label="Attachments"
  name="attachments"
  description="PDFs and images, up to 2 MB each."
  accept=".pdf,image/*"
  max-file-size="2097152"
  max-files="3"
  style="width: 100%"
></pf-file-uploader>`,
  },

  'pf-gauge-chart': {
    html: `<pf-gauge-chart label="Storage used" value="73" size="180">
  <span slot="center">73%</span>
  <span slot="sub">of 2 TB</span>
</pf-gauge-chart>`,
  },

  'pf-header-navigation': {
    html: `<pf-header-navigation label="Main" style="width: 100%">
  <strong slot="brand">Pitchfork</strong>
  <pf-nav-item href="#" current>Docs</pf-nav-item>
  <pf-nav-item href="#">Components</pf-nav-item>
  <pf-nav-item href="#">Tokens</pf-nav-item>
  <pf-button slot="actions" size="sm">Sign in</pf-button>
</pf-header-navigation>`,
  },

  'pf-heatmap': {
    html: `<pf-heatmap
  label="Commits in the last eight weeks"
  start-date="2026-01-05"
  end-date="2026-03-01"
  week-starts-on="1"
  data='[{"date": "2026-01-07", "value": 4}, {"date": "2026-01-08", "value": 1}, {"date": "2026-01-20", "value": 7}, {"date": "2026-02-02", "value": 3}, {"date": "2026-02-14", "value": 9}, {"date": "2026-02-25", "value": 2}]'
></pf-heatmap>`,
  },

  'pf-icon': {
    html: `<pf-icon name="circle-check" label="Done"></pf-icon>
<pf-icon name="triangle-exclamation" label="Warning"></pf-icon>
<pf-icon name="calendar"></pf-icon>
<pf-icon name="chevron-down"></pf-icon>`,
    interactive: `<pf-icon name="circle-check" label="Done"></pf-icon>`,
  },

  'pf-inline-cta': {
    html: `<pf-inline-cta tone="info" icon="circle-info" dismissible style="width: 100%">
  Try the web components
  <span slot="description">Every React component has an element answer.</span>
  <pf-button slot="action" size="sm" variant="secondary">Read the guide</pf-button>
</pf-inline-cta>`,
  },

  'pf-input': {
    html: `<pf-input
  label="Email"
  name="email"
  type="email"
  placeholder="you@example.com"
  description="We only use this to send receipts."
  style="min-width: 18rem"
></pf-input>
<pf-input
  label="Postcode"
  name="postcode"
  value="SW1A 1AA"
  error="That postcode is not in our delivery area."
  style="min-width: 18rem"
></pf-input>`,
    interactive: `<pf-input label="Email" name="email" placeholder="you@example.com" style="min-width: 18rem"></pf-input>`,
  },

  'pf-kbd': {
    html: `<pf-kbd>Esc</pf-kbd>
<pf-kbd size="sm" id="shortcut"></pf-kbd>`,
    // `keys` is typed `string[]`, so Stencil gives it no attribute at all and
    // there is no markup that can set it — the trap `validate_usage` reports
    // as an error. Assigning the property is what a consumer has to do too.
    setup: (root) => {
      const kbd = root.querySelector('#shortcut') as (HTMLElement & { keys?: string[] }) | null;
      if (kbd) kbd.keys = ['⌘', 'K'];
    },
    interactive: `<pf-kbd>Esc</pf-kbd>`,
  },

  'pf-line-chart': {
    html: `<pf-line-chart
  label="Weekly visits"
  y-axis-label="Visits"
  area
  data='[["Mon", 12], ["Tue", 18], ["Wed", 9], ["Thu", 22], ["Fri", 17]]'
  style="width: 100%"
>
  <pf-chart-series series-key="0" color="var(--color-brand-500)">Visits</pf-chart-series>
</pf-line-chart>`,
  },

  'pf-loading-dots': {
    html: `<pf-loading-dots size="sm" label="Loading"></pf-loading-dots>
<pf-loading-dots label="Loading"></pf-loading-dots>
<pf-loading-dots size="lg" label="Loading"></pf-loading-dots>`,
    interactive: `<pf-loading-dots label="Loading"></pf-loading-dots>`,
  },

  'pf-loading-skeleton': {
    html: `<div style="width: 100%; display: grid; gap: 0.5rem">
  <pf-loading-skeleton width="60%" height="20"></pf-loading-skeleton>
  <pf-loading-skeleton></pf-loading-skeleton>
  <pf-loading-skeleton width="80%"></pf-loading-skeleton>
  <pf-loading-skeleton width="40" height="40" rounded></pf-loading-skeleton>
</div>`,
    interactive: `<pf-loading-skeleton style="width: 100%"></pf-loading-skeleton>`,
  },

  'pf-loading-spinner': {
    html: `<pf-loading-spinner size="16" label="Loading"></pf-loading-spinner>
<pf-loading-spinner label="Loading"></pf-loading-spinner>
<pf-loading-spinner size="40" label="Loading"></pf-loading-spinner>`,
    interactive: `<pf-loading-spinner label="Loading"></pf-loading-spinner>`,
  },

  'pf-menu-item': {
    html: `<pf-dropdown label="Actions">
  <pf-button variant="secondary">Open the menu</pf-button>
  <div slot="menu">
    <pf-menu-item value="open">
      <pf-icon slot="icon" name="file"></pf-icon>
      Open
    </pf-menu-item>
    <pf-menu-item value="search">
      Find…
      <span slot="shortcut">⌘F</span>
    </pf-menu-item>
    <pf-menu-item value="archive" disabled>Archive</pf-menu-item>
    <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
  </div>
</pf-dropdown>`,
    interactive: `<pf-menu-item value="edit">Edit</pf-menu-item>`,
  },

  'pf-menu-separator': {
    html: `<pf-dropdown label="Actions">
  <pf-button variant="secondary">Open the menu</pf-button>
  <div slot="menu">
    <pf-menu-item value="cut">Cut</pf-menu-item>
    <pf-menu-item value="copy">Copy</pf-menu-item>
    <pf-menu-separator></pf-menu-separator>
    <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
  </div>
</pf-dropdown>`,
  },

  'pf-metric-card': {
    html: `<pf-metric-card icon="chart-bar" trend="positive" style="min-width: 15rem">
  <span slot="heading">Monthly revenue</span>
  £48,210
  <span slot="trend">+12.4%</span>
  <span slot="description">Compared with the month before.</span>
</pf-metric-card>`,
  },

  'pf-metric-grid': {
    html: `<pf-metric-grid style="width: 100%">
  <pf-metric-card trend="positive">
    <span slot="heading">Revenue</span>
    £48,210
    <span slot="trend">+12.4%</span>
  </pf-metric-card>
  <pf-metric-card trend="negative">
    <span slot="heading">Churn</span>
    2.1%
    <span slot="trend">-0.3%</span>
  </pf-metric-card>
  <pf-metric-card>
    <span slot="heading">Active seats</span>
    1,204
  </pf-metric-card>
</pf-metric-grid>`,
  },

  'pf-modal': {
    html: `<pf-button data-open variant="primary">Delete the workspace</pf-button>
<pf-modal label="Delete the workspace">
  <pf-modal-header><strong>Delete the workspace</strong></pf-modal-header>
  <pf-modal-body>Everything in it goes with it. This cannot be undone.</pf-modal-body>
  <pf-modal-footer>
    <pf-button variant="secondary" data-close>Cancel</pf-button>
    <pf-button variant="destructive" data-close>Delete</pf-button>
  </pf-modal-footer>
</pf-modal>`,
    // Shown closed, because `showModal()` would otherwise take over the whole
    // docs page on load. Opening it from a trigger is also how a consumer
    // uses it.
    setup: (root) => {
      const modal = root.querySelector('pf-modal') as (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (modal) modal.open = true;
      });
      for (const button of root.querySelectorAll('[data-close]')) {
        button.addEventListener('click', () => {
          if (modal) modal.open = false;
        });
      }
    },
    interactive: `<pf-modal label="Delete the workspace" open>
  <pf-modal-header><strong>Delete the workspace</strong></pf-modal-header>
  <pf-modal-body>Everything in it goes with it. This cannot be undone.</pf-modal-body>
  <pf-modal-footer>
    <pf-button variant="secondary">Cancel</pf-button>
    <pf-button variant="destructive">Delete</pf-button>
  </pf-modal-footer>
</pf-modal>`,
  },

  'pf-modal-body': {
    html: `<pf-button data-open variant="secondary">Open the dialog</pf-button>
<pf-modal label="Scrolling body">
  <pf-modal-header><strong>Terms</strong></pf-modal-header>
  <pf-modal-body>The body is the part that scrolls when the content is taller than the dialog.</pf-modal-body>
</pf-modal>`,
    // Closed, with a trigger. `showModal()` promotes the dialog to the top
    // layer, so an `open` modal covers the whole docs page rather than
    // sitting in the preview box — measured, before this was fixed.
    setup: (root) => {
      const modal = root.querySelector('pf-modal') as (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (modal) modal.open = true;
      });
    },
    interactive: `<pf-modal label="Scrolling body" open>
  <pf-modal-header><strong>Terms</strong></pf-modal-header>
  <pf-modal-body>The body is the part that scrolls when the content is taller than the dialog.</pf-modal-body>
</pf-modal>`,
  },

  'pf-modal-footer': {
    html: `<pf-button data-open variant="secondary">Open the dialog</pf-button>
<pf-modal label="With a footer">
  <pf-modal-body>The footer keeps its actions against the bottom edge.</pf-modal-body>
  <pf-modal-footer>
    <pf-button variant="secondary">Cancel</pf-button>
    <pf-button variant="primary">Save</pf-button>
  </pf-modal-footer>
</pf-modal>`,
    // Closed, with a trigger. `showModal()` promotes the dialog to the top
    // layer, so an `open` modal covers the whole docs page rather than
    // sitting in the preview box — measured, before this was fixed.
    setup: (root) => {
      const modal = root.querySelector('pf-modal') as (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (modal) modal.open = true;
      });
    },
    interactive: `<pf-modal label="With a footer" open>
  <pf-modal-body>The footer keeps its actions against the bottom edge.</pf-modal-body>
  <pf-modal-footer>
    <pf-button variant="secondary">Cancel</pf-button>
    <pf-button variant="primary">Save</pf-button>
  </pf-modal-footer>
</pf-modal>`,
  },

  'pf-modal-header': {
    html: `<pf-button data-open variant="secondary">Open the dialog</pf-button>
<pf-modal label="With a header">
  <pf-modal-header><strong>Rename the project</strong></pf-modal-header>
  <pf-modal-body>The header sits above the rule and beside the close button.</pf-modal-body>
</pf-modal>`,
    // Closed, with a trigger. `showModal()` promotes the dialog to the top
    // layer, so an `open` modal covers the whole docs page rather than
    // sitting in the preview box — measured, before this was fixed.
    setup: (root) => {
      const modal = root.querySelector('pf-modal') as (HTMLElement & { open?: boolean }) | null;
      root.querySelector('[data-open]')?.addEventListener('click', () => {
        if (modal) modal.open = true;
      });
    },
    interactive: `<pf-modal label="With a header" open>
  <pf-modal-header><strong>Rename the project</strong></pf-modal-header>
  <pf-modal-body>The header sits above the rule and beside the close button.</pf-modal-body>
</pf-modal>`,
  },

  'pf-multi-select': {
    html: `<pf-multi-select
  label="Colours"
  name="colours"
  value="red,blue"
  style="min-width: 18rem"
>
  <pf-option value="red">Red</pf-option>
  <pf-option value="green">Green</pf-option>
  <pf-option value="blue">Blue</pf-option>
  <pf-option value="violet">Violet</pf-option>
</pf-multi-select>`,
  },

  'pf-nav-item': {
    html: `<pf-header-navigation label="Horizontal" style="width: 100%">
  <pf-nav-item href="#" current>Docs</pf-nav-item>
  <pf-nav-item href="#">
    <pf-icon slot="icon" name="calendar"></pf-icon>
    Schedule
  </pf-nav-item>
  <pf-nav-item href="#">
    Inbox
    <pf-badge slot="badge" variant="brand">4</pf-badge>
  </pf-nav-item>
  <pf-nav-item disabled>Billing</pf-nav-item>
</pf-header-navigation>`,
    interactive: `<pf-header-navigation label="Main" style="width: 100%">
  <pf-nav-item href="#" current>Docs</pf-nav-item>
  <pf-nav-item href="#">Components</pf-nav-item>
</pf-header-navigation>`,
  },

  'pf-nav-section': {
    html: `<pf-sidebar-navigation label="Sidebar" style="min-width: 14rem">
  <pf-nav-section>
    <span slot="title">Workspace</span>
    <pf-nav-item href="#" orientation="vertical" current>Overview</pf-nav-item>
    <pf-nav-item href="#" orientation="vertical">Members</pf-nav-item>
  </pf-nav-section>
  <pf-nav-section>
    <pf-nav-item href="#" orientation="vertical">Untitled section</pf-nav-item>
  </pf-nav-section>
</pf-sidebar-navigation>`,
    interactive: `<pf-sidebar-navigation label="Sidebar" style="min-width: 14rem">
  <pf-nav-section>
    <span slot="title">Workspace</span>
    <pf-nav-item href="#" orientation="vertical" current>Overview</pf-nav-item>
    <pf-nav-item href="#" orientation="vertical">Members</pf-nav-item>
  </pf-nav-section>
</pf-sidebar-navigation>`,
  },

  'pf-notification': {
    html: `<pf-notification variant="success" heading="Saved" dismissable style="width: 100%">
  Your changes are live.
  <pf-button slot="action" size="sm" variant="ghost">Undo</pf-button>
</pf-notification>`,
  },

  'pf-number-input': {
    html: `<pf-number-input
  label="Quantity"
  name="quantity"
  value="2"
  min="0"
  max="10"
  step="1"
  style="min-width: 12rem"
></pf-number-input>`,
  },

  'pf-option': {
    html: `<pf-select label="Fruit" name="fruit" value="banana" style="min-width: 16rem">
  <pf-option value="apple">Apple</pf-option>
  <pf-option value="banana">Banana</pf-option>
  <pf-option value="cherry" disabled>Cherry (out of season)</pf-option>
</pf-select>`,
    interactive: `<pf-option value="banana">Banana</pf-option>`,
  },

  'pf-page-header': {
    html: `<pf-page-header style="width: 100%">
  <pf-breadcrumbs slot="breadcrumbs">
    <pf-breadcrumb href="#">Projects</pf-breadcrumb>
    <pf-breadcrumb>Atlas</pf-breadcrumb>
  </pf-breadcrumbs>
  <span slot="eyebrow">Project</span>
  Atlas
  <span slot="description">Shipping in March. Owned by the platform team.</span>
  <pf-badge slot="metadata" variant="success">On track</pf-badge>
  <pf-button slot="actions" size="sm">Edit</pf-button>
</pf-page-header>`,
  },

  'pf-pagination': {
    html: `<pf-pagination page="4" total-pages="12"></pf-pagination>`,
  },

  'pf-pie-chart': {
    html: `<pf-pie-chart label="Traffic by source" size="180">
  <pf-pie-slice value="48" color="var(--color-brand-500)">Direct</pf-pie-slice>
  <pf-pie-slice value="31" color="var(--color-teal-500)">Search</pf-pie-slice>
  <pf-pie-slice value="21" color="var(--color-amber-500)">Referral</pf-pie-slice>
  <span slot="center">1,204</span>
</pf-pie-chart>`,
  },

  'pf-pie-slice': {
    html: `<pf-pie-chart label="Three equal thirds" size="160">
  <pf-pie-slice value="1" color="var(--color-brand-500)">One</pf-pie-slice>
  <pf-pie-slice value="1" color="var(--color-teal-500)">Two</pf-pie-slice>
  <pf-pie-slice value="1" color="var(--color-amber-500)">Three</pf-pie-slice>
</pf-pie-chart>`,
    interactive: `<pf-pie-chart label="Two slices" size="180">
  <pf-pie-slice value="48" color="var(--color-brand-500)">Direct</pf-pie-slice>
  <pf-pie-slice value="52" color="var(--color-teal-500)">Search</pf-pie-slice>
</pf-pie-chart>`,
  },

  'pf-popover': {
    html: `<pf-popover label="Filters">
  <pf-button variant="secondary">Filters</pf-button>
  <div slot="content" style="display: grid; gap: 0.5rem; min-width: 12rem">
    <pf-checkbox label="Open" checked></pf-checkbox>
    <pf-checkbox label="Assigned to me"></pf-checkbox>
  </div>
</pf-popover>`,
  },

  'pf-progress-bar': {
    html: `<pf-progress-bar label="Upload" value="64" style="width: 100%"></pf-progress-bar>
<pf-progress-bar label="Disk" value="18" max="20" style="width: 100%"></pf-progress-bar>`,
    interactive: `<pf-progress-bar label="Upload" value="64" style="width: 100%"></pf-progress-bar>`,
  },

  'pf-progress-circle': {
    html: `<pf-progress-circle label="Sync" value="42"></pf-progress-circle>
<pf-progress-circle label="Done" value="100" size="88" stroke-width="8"></pf-progress-circle>`,
    interactive: `<pf-progress-circle label="Sync" value="42"></pf-progress-circle>`,
  },

  'pf-progress-step': {
    html: `<pf-progress-steps style="width: 100%">
  <pf-progress-step state="complete" position="1">
    <span slot="title">Basket</span>
  </pf-progress-step>
  <pf-progress-step state="current" position="2">
    <span slot="title">Delivery</span>
    <span slot="description">Where it goes</span>
  </pf-progress-step>
  <pf-progress-step state="upcoming" position="3" last>
    <span slot="title">Payment</span>
  </pf-progress-step>
</pf-progress-steps>`,
    interactive: `<pf-progress-steps style="width: 100%">
  <pf-progress-step state="current" position="1">
    <span slot="title">Delivery</span>
    <span slot="description">Where it goes</span>
  </pf-progress-step>
  <pf-progress-step state="upcoming" position="2" last>
    <span slot="title">Payment</span>
  </pf-progress-step>
</pf-progress-steps>`,
  },

  'pf-progress-steps': {
    html: `<pf-progress-steps orientation="vertical" style="width: 100%">
  <pf-progress-step state="complete" position="1">
    <span slot="title">Signed up</span>
  </pf-progress-step>
  <pf-progress-step state="current" position="2">
    <span slot="title">Verify your email</span>
  </pf-progress-step>
  <pf-progress-step state="upcoming" position="3" last>
    <span slot="title">Invite your team</span>
  </pf-progress-step>
</pf-progress-steps>`,
  },

  'pf-radar-axis': {
    html: `<pf-radar-chart label="One series" size="240">
  <pf-radar-axis label="Speed" value="8"></pf-radar-axis>
  <pf-radar-axis label="Accuracy" value="6"></pf-radar-axis>
  <pf-radar-axis label="Coverage" value="9"></pf-radar-axis>
  <pf-radar-axis label="Cost" value="4"></pf-radar-axis>
</pf-radar-chart>`,
    interactive: `<pf-radar-chart label="Three axes" size="240">
  <pf-radar-axis label="Speed" value="8"></pf-radar-axis>
  <pf-radar-axis label="Accuracy" value="6"></pf-radar-axis>
  <pf-radar-axis label="Coverage" value="9"></pf-radar-axis>
</pf-radar-chart>`,
  },

  'pf-radar-chart': {
    html: `<pf-radar-chart label="Capability review" size="260" max="10">
  <pf-radar-axis label="Speed" value="8"></pf-radar-axis>
  <pf-radar-axis label="Accuracy" value="6"></pf-radar-axis>
  <pf-radar-axis label="Coverage" value="9"></pf-radar-axis>
  <pf-radar-axis label="Cost" value="4"></pf-radar-axis>
  <pf-radar-axis label="Support" value="7"></pf-radar-axis>
</pf-radar-chart>`,
  },

  'pf-radio-button': {
    html: `<pf-radio-group name="plan" legend="Plan" value="pro">
  <pf-radio-button value="free">
    Free
    <span slot="description">One project, community support.</span>
  </pf-radio-button>
  <pf-radio-button value="pro">
    Pro
    <span slot="description">Unlimited projects.</span>
  </pf-radio-button>
  <pf-radio-button value="team" disabled>Team (invite only)</pf-radio-button>
</pf-radio-group>`,
    interactive: `<pf-radio-group name="plan" legend="Plan" value="pro">
  <pf-radio-button value="pro">
    Pro
    <span slot="description">Unlimited projects.</span>
  </pf-radio-button>
  <pf-radio-button value="free">Free</pf-radio-button>
</pf-radio-group>`,
  },

  'pf-radio-group': {
    html: `<pf-radio-group name="delivery" legend="Delivery" value="standard" orientation="horizontal">
  <pf-radio-button value="standard">Standard</pf-radio-button>
  <pf-radio-button value="express">Express</pf-radio-button>
</pf-radio-group>`,
  },

  'pf-rating-badge': {
    html: `<pf-rating-badge value="4.6" reviews="1204"></pf-rating-badge>
<pf-rating-badge value="3.2" size="sm"></pf-rating-badge>`,
    interactive: `<pf-rating-badge value="4.6" reviews="1204"></pf-rating-badge>`,
  },

  'pf-rating-stars': {
    html: `<pf-rating-stars label="Average rating" value="4.5" show-value></pf-rating-stars>
<pf-rating-stars label="Out of ten" value="7" max="10" size="14"></pf-rating-stars>`,
    interactive: `<pf-rating-stars label="Average rating" value="4.5" show-value></pf-rating-stars>`,
  },

  'pf-resizable': {
    html: `<pf-resizable size="40" style="width: 100%; height: 9rem">
  <pf-card slot="start" style="height: 100%"><pf-card-content>Start</pf-card-content></pf-card>
  <pf-card slot="end" style="height: 100%"><pf-card-content>Drag the handle between us.</pf-card-content></pf-card>
</pf-resizable>`,
  },

  'pf-rich-text-editor': {
    html: `<pf-rich-text-editor
  label="Release notes"
  name="notes"
  value="<p>A <strong>first</strong> note.</p>"
  style="width: 100%"
></pf-rich-text-editor>`,
  },

  'pf-scroll-area': {
    html: `<pf-scroll-area style="width: 100%; max-width: 20rem; height: 7rem">
  <p style="margin: 0 0 0.75rem">One.</p>
  <p style="margin: 0 0 0.75rem">Two.</p>
  <p style="margin: 0 0 0.75rem">Three.</p>
  <p style="margin: 0 0 0.75rem">Four.</p>
  <p style="margin: 0">Five.</p>
</pf-scroll-area>`,
  },

  'pf-section-footer': {
    html: `<pf-section-footer style="width: 100%">
  Totals exclude VAT.
  <span slot="description">Prices are shown in pounds sterling.</span>
  <pf-button slot="actions" size="sm">Export</pf-button>
</pf-section-footer>`,
  },

  'pf-section-header': {
    html: `<pf-section-header divider style="width: 100%">
  <span slot="eyebrow">Billing</span>
  Invoices
  <span slot="description">Everything issued in the last twelve months.</span>
  <pf-badge slot="metadata">12</pf-badge>
  <pf-button slot="actions" size="sm">New invoice</pf-button>
</pf-section-header>`,
  },

  'pf-select': {
    html: `<pf-select label="Fruit" name="fruit" value="banana" style="min-width: 16rem">
  <pf-option value="apple">Apple</pf-option>
  <pf-option value="banana">Banana</pf-option>
  <pf-option value="cherry">Cherry</pf-option>
  <pf-option value="damson">Damson</pf-option>
</pf-select>`,
  },

  'pf-sidebar-navigation': {
    html: `<pf-sidebar-navigation label="Sidebar" style="min-width: 15rem">
  <strong slot="header">Atlas</strong>
  <pf-nav-section>
    <span slot="title">Workspace</span>
    <pf-nav-item href="#" orientation="vertical" current>Overview</pf-nav-item>
    <pf-nav-item href="#" orientation="vertical">
      Inbox
      <pf-badge slot="badge" variant="brand">4</pf-badge>
    </pf-nav-item>
  </pf-nav-section>
  <pf-nav-section>
    <span slot="title">Settings</span>
    <pf-nav-item href="#" orientation="vertical">Members</pf-nav-item>
    <pf-nav-item orientation="vertical" disabled>Billing</pf-nav-item>
  </pf-nav-section>
  <pf-button slot="footer" size="sm" variant="ghost">Sign out</pf-button>
</pf-sidebar-navigation>`,
  },

  'pf-slideout-menu': {
    html: `<pf-button id="open-slideout" variant="secondary">Open the menu</pf-button>
<pf-slideout-menu id="demo-slideout" label="Navigation" heading="Navigation">
  <pf-nav-item href="#" orientation="vertical" current>Overview</pf-nav-item>
  <pf-nav-item href="#" orientation="vertical">Members</pf-nav-item>
  <pf-button slot="footer" size="sm" variant="ghost">Sign out</pf-button>
</pf-slideout-menu>`,
    setup: (root) => {
      const menu = root.querySelector('#demo-slideout') as
        (HTMLElement & { show?: () => void }) | null;
      root.querySelector('#open-slideout')?.addEventListener('click', () => menu?.show?.());
    },
  },

  'pf-slider': {
    html: `<pf-slider label="Volume" name="volume" value="40" style="min-width: 18rem"></pf-slider>
<pf-slider
  label="Budget"
  name="budget"
  value="250"
  min="50"
  max="500"
  step="25"
  description="Per month, in pounds."
  style="min-width: 18rem"
></pf-slider>`,
    interactive: `<pf-slider label="Volume" name="volume" value="40" style="min-width: 18rem"></pf-slider>`,
  },

  'pf-sparkline': {
    html: `<pf-sparkline label="Last fourteen days" data="[4, 7, 5, 9, 8, 12, 10, 14, 11, 16, 15, 19, 17, 22]"></pf-sparkline>
<pf-sparkline
  label="As an area"
  variant="area"
  end-dot
  color="var(--color-teal-500)"
  data="[12, 9, 14, 11, 16, 13, 18]"
></pf-sparkline>`,
    interactive: `<pf-sparkline label="Last fourteen days" data="[4, 7, 5, 9, 8, 12, 10, 14, 11, 16, 15, 19, 17, 22]"></pf-sparkline>`,
  },

  'pf-switch': {
    html: `<pf-switch name="notify" label="Email me about replies"></pf-switch>
<pf-switch name="beta" label="Join the beta" checked></pf-switch>
<pf-switch name="locked" label="Managed by your admin" disabled></pf-switch>`,
    interactive: `<pf-switch name="notify" label="Email me about replies"></pf-switch>`,
  },

  'pf-tab': {
    html: `<pf-tabs value="overview" style="width: 100%">
  <pf-tab value="overview">Overview</pf-tab>
  <pf-tab-panel value="overview">What the project is for.</pf-tab-panel>
  <pf-tab value="activity" count="12">
    <span>Activity</span>
  </pf-tab>
  <pf-tab-panel value="activity">Twelve things happened.</pf-tab-panel>
  <pf-tab value="settings" disabled>Settings</pf-tab>
  <pf-tab-panel value="settings">Not available.</pf-tab-panel>
</pf-tabs>`,
    interactive: `<pf-tabs value="overview" style="width: 100%">
  <pf-tab value="overview">Overview</pf-tab>
  <pf-tab-panel value="overview">What the project is for.</pf-tab-panel>
  <pf-tab value="activity" count="12">Activity</pf-tab>
  <pf-tab-panel value="activity">Twelve things happened.</pf-tab-panel>
</pf-tabs>`,
  },

  'pf-tab-panel': {
    html: `<pf-tabs value="first" style="width: 100%">
  <pf-tab value="first">First</pf-tab>
  <pf-tab-panel value="first">Only the active panel is in the DOM flow.</pf-tab-panel>
  <pf-tab value="second">Second</pf-tab>
  <pf-tab-panel value="second">Switch tabs to see this one.</pf-tab-panel>
</pf-tabs>`,
    interactive: `<pf-tabs value="first" style="width: 100%">
  <pf-tab value="first">First</pf-tab>
  <pf-tab-panel value="first">Only the active panel is in the DOM flow.</pf-tab-panel>
</pf-tabs>`,
  },

  'pf-table': {
    html: `<pf-table label="Orders" striped sort-key="name" sort-direction="asc" style="width: 100%">
  <span slot="caption">Three recent orders.</span>
  <pf-table-row head>
    <pf-table-cell head sortable sort-key="name" sort="ascending" width="140">Item</pf-table-cell>
    <pf-table-cell head sortable sort-key="total" align="right">Total</pf-table-cell>
    <pf-table-cell head>Notes</pf-table-cell>
  </pf-table-row>
  <pf-table-row>
    <pf-table-cell>Item 1</pf-table-cell>
    <pf-table-cell align="right">£24.00</pf-table-cell>
    <pf-table-cell>Gift</pf-table-cell>
  </pf-table-row>
  <pf-table-row odd>
    <pf-table-cell>Item 2</pf-table-cell>
    <pf-table-cell align="right">£18.50</pf-table-cell>
    <pf-table-cell>—</pf-table-cell>
  </pf-table-row>
  <pf-table-row last>
    <pf-table-cell>Item 10</pf-table-cell>
    <pf-table-cell align="right">£9.00</pf-table-cell>
    <pf-table-cell>Rush</pf-table-cell>
  </pf-table-row>
</pf-table>`,
  },

  'pf-table-cell': {
    html: `<pf-table label="Alignment and widths" style="width: 100%">
  <pf-table-row head>
    <pf-table-cell head width="160">Fixed at 160px</pf-table-cell>
    <pf-table-cell head align="center">Centred</pf-table-cell>
    <pf-table-cell head align="right" sortable sort-key="total">Sortable</pf-table-cell>
  </pf-table-row>
  <pf-table-row last>
    <pf-table-cell>Left by default</pf-table-cell>
    <pf-table-cell align="center">Middle</pf-table-cell>
    <pf-table-cell align="right">£9.00</pf-table-cell>
  </pf-table-row>
</pf-table>`,
    interactive: `<pf-table label="Two cells" style="width: 100%">
  <pf-table-row head>
    <pf-table-cell head width="160">Item</pf-table-cell>
    <pf-table-cell head align="right">Total</pf-table-cell>
  </pf-table-row>
  <pf-table-row last>
    <pf-table-cell>Item 1</pf-table-cell>
    <pf-table-cell align="right">£24.00</pf-table-cell>
  </pf-table-row>
</pf-table>`,
  },

  'pf-table-row': {
    html: `<pf-table label="Striping comes from the row" striped style="width: 100%">
  <pf-table-row head>
    <pf-table-cell head>Row</pf-table-cell>
    <pf-table-cell head>State</pf-table-cell>
  </pf-table-row>
  <pf-table-row>
    <pf-table-cell>First</pf-table-cell>
    <pf-table-cell>even</pf-table-cell>
  </pf-table-row>
  <pf-table-row odd>
    <pf-table-cell>Second</pf-table-cell>
    <pf-table-cell>odd — shaded</pf-table-cell>
  </pf-table-row>
  <pf-table-row last>
    <pf-table-cell>Third</pf-table-cell>
    <pf-table-cell>last — no rule beneath</pf-table-cell>
  </pf-table-row>
</pf-table>`,
    interactive: `<pf-table label="One body row" striped style="width: 100%">
  <pf-table-row head>
    <pf-table-cell head>Row</pf-table-cell>
    <pf-table-cell head>State</pf-table-cell>
  </pf-table-row>
  <pf-table-row last>
    <pf-table-cell>First</pf-table-cell>
    <pf-table-cell>even</pf-table-cell>
  </pf-table-row>
</pf-table>`,
  },

  'pf-tabs': {
    html: `<pf-tabs value="pill-one" variant="pills" style="width: 100%">
  <pf-tab value="pill-one">Details</pf-tab>
  <pf-tab-panel value="pill-one">One tab and one panel per item, interleaved.</pf-tab-panel>
  <pf-tab value="pill-two">History</pf-tab>
  <pf-tab-panel value="pill-two">Each tab puts itself in the strip.</pf-tab-panel>
</pf-tabs>`,
  },

  'pf-tag': {
    html: `<pf-tag>neutral</pf-tag>
<pf-tag variant="brand">brand</pf-tag>
<pf-tag variant="success" dismissible>success</pf-tag>
<pf-tag variant="danger" dismissible>danger</pf-tag>`,
    interactive: `<pf-tag>Tag</pf-tag>`,
  },

  'pf-tag-input': {
    html: `<pf-tag-input
  label="Topics"
  name="topics"
  value="design,systems"
  tag-variant="brand"
  max="5"
  description="Enter or comma to add. Paste a comma-separated list to add several."
  style="min-width: 20rem"
></pf-tag-input>`,
  },

  'pf-textarea': {
    html: `<pf-textarea
  label="Message"
  name="message"
  rows="3"
  placeholder="What happened?"
  description="Markdown is not supported."
  style="min-width: 20rem"
></pf-textarea>`,
  },

  'pf-time-picker': {
    html: `<pf-time-picker label="Start" name="start" value="14:30"></pf-time-picker>
<pf-time-picker
  label="End (12-hour)"
  name="end"
  value="09:15"
  hour-cycle="12"
  minute-step="15"
></pf-time-picker>`,
    interactive: `<pf-time-picker label="Start" name="start" value="14:30"></pf-time-picker>`,
  },

  'pf-timeline': {
    html: `<pf-timeline label="Order history" style="width: 100%">
  <pf-timeline-item tone="success">
    <pf-icon slot="icon" name="circle-check"></pf-icon>
    <span slot="title">Delivered</span>
    <span slot="timestamp">14 March, 09:12</span>
    <span slot="description">Left with a neighbour.</span>
  </pf-timeline-item>
  <pf-timeline-item>
    <span slot="title">Out for delivery</span>
    <span slot="timestamp">14 March, 06:40</span>
  </pf-timeline-item>
  <pf-timeline-item last>
    <span slot="title">Order placed</span>
    <span slot="timestamp">12 March, 18:05</span>
  </pf-timeline-item>
</pf-timeline>`,
  },

  'pf-timeline-item': {
    html: `<pf-timeline label="With and without an icon" style="width: 100%">
  <pf-timeline-item tone="danger">
    <pf-icon slot="icon" name="triangle-exclamation"></pf-icon>
    <span slot="title">Payment failed</span>
    <span slot="description">The marker grows to hold a slotted icon.</span>
  </pf-timeline-item>
  <pf-timeline-item last>
    <span slot="title">No icon</span>
    <span slot="description">A plain dot, measured in the real build rather than guessed from CSS.</span>
  </pf-timeline-item>
</pf-timeline>`,
    interactive: `<pf-timeline label="One event" style="width: 100%">
  <pf-timeline-item tone="success" last>
    <pf-icon slot="icon" name="circle-check"></pf-icon>
    <span slot="title">Delivered</span>
    <span slot="timestamp">14 March, 09:12</span>
  </pf-timeline-item>
</pf-timeline>`,
  },

  'pf-toaster': {
    html: `<pf-button id="raise-toast" variant="secondary">Raise a toast</pf-button>
<pf-toaster id="demo-toaster" placement="bottom-right" duration="4000"></pf-toaster>`,
    // The one element here that takes options rather than child elements: a
    // toast is an event that happened, not data the consumer is rendering, so
    // there is nothing to put in markup.
    setup: (root) => {
      const toaster = root.querySelector('#demo-toaster') as
        (HTMLElement & { toast?: (options: Record<string, unknown>) => void }) | null;
      let count = 0;
      root.querySelector('#raise-toast')?.addEventListener('click', () => {
        count += 1;
        toaster?.toast?.({
          variant: count % 2 ? 'success' : 'info',
          heading: `Saved (${count})`,
          description: 'Dismisses itself after four seconds.',
        });
      });
    },
  },

  'pf-toolbar': {
    html: `<pf-toolbar style="width: 100%">
  <pf-utility-button label="Search" tooltip="Search">
    <pf-icon slot="icon" name="magnifying-glass"></pf-icon>
  </pf-utility-button>
  <pf-utility-button label="Favourite" tooltip="Favourite">
    <pf-icon slot="icon" name="star"></pf-icon>
  </pf-utility-button>
  <pf-toolbar-separator></pf-toolbar-separator>
  <pf-utility-button label="Notifications" tooltip="Notifications" disabled>
    <pf-icon slot="icon" name="bell"></pf-icon>
  </pf-utility-button>
</pf-toolbar>`,
  },

  'pf-toolbar-separator': {
    html: `<pf-toolbar style="width: 100%">
  <pf-utility-button label="Copy">
    <pf-icon slot="icon" name="copy"></pf-icon>
  </pf-utility-button>
  <pf-toolbar-separator></pf-toolbar-separator>
  <pf-utility-button label="Download">
    <pf-icon slot="icon" name="file-arrow-down"></pf-icon>
  </pf-utility-button>
</pf-toolbar>`,
  },

  'pf-tooltip': {
    html: `<pf-tooltip placement="top">
  <pf-button variant="secondary">Hover or focus me</pf-button>
  <span slot="content">The panel is a popover, so it escapes any clipping ancestor.</span>
</pf-tooltip>`,
  },

  'pf-tree-item': {
    html: `<pf-tree-view label="Project files" expanded="src" style="min-width: 16rem">
  <pf-tree-item value="src" has-children expanded>
    <span slot="label">src</span>
    <pf-tree-item value="index.ts">
      <span slot="label">index.ts</span>
    </pf-tree-item>
    <pf-tree-item value="app.ts">
      <span slot="label">app.ts</span>
      <pf-badge slot="badge" variant="warning">2</pf-badge>
    </pf-tree-item>
  </pf-tree-item>
  <pf-tree-item value="readme.md">
    <span slot="label">README.md</span>
  </pf-tree-item>
</pf-tree-view>`,
    interactive: `<pf-tree-view label="Files" expanded="src" style="min-width: 16rem">
  <pf-tree-item value="src" has-children expanded>
    <span slot="label">src</span>
    <pf-tree-item value="index.ts">
      <span slot="label">index.ts</span>
    </pf-tree-item>
  </pf-tree-item>
</pf-tree-view>`,
  },

  'pf-tree-view': {
    html: `<pf-tree-view label="Files" expanded="docs" value="guide.md" style="min-width: 16rem">
  <pf-tree-item value="docs" has-children expanded>
    <span slot="label">docs</span>
    <pf-tree-item value="guide.md" selected>
      <span slot="label">guide.md</span>
    </pf-tree-item>
    <pf-tree-item value="api.md">
      <span slot="label">api.md</span>
    </pf-tree-item>
  </pf-tree-item>
  <pf-tree-item value="package.json">
    <span slot="label">package.json</span>
  </pf-tree-item>
</pf-tree-view>`,
  },

  'pf-utility-button': {
    html: `<pf-utility-button label="Copy" tooltip="Copy to clipboard">
  <pf-icon slot="icon" name="copy"></pf-icon>
</pf-utility-button>
<pf-utility-button label="Delete" tooltip="Delete" variant="destructive">
  <pf-icon slot="icon" name="circle-xmark"></pf-icon>
</pf-utility-button>
<pf-utility-button label="Search" tooltip="Search" disabled>
  <pf-icon slot="icon" name="magnifying-glass"></pf-icon>
</pf-utility-button>`,
    interactive: `<pf-utility-button label="Copy" tooltip="Copy to clipboard">
  <pf-icon slot="icon" name="copy"></pf-icon>
</pf-utility-button>`,
  },

  'pf-video-player': {
    html: `<pf-video-player label="Product tour" style="width: 100%; max-width: 24rem">
  <span slot="empty">No video source yet.</span>
</pf-video-player>`,
    // No video in this repository, so this shows the empty slot rather than a
    // broken `src`. `sources` is typed `PfVideoSource[]` and gets no attribute
    // from Stencil, so a consumer assigns the property or sets plain `src`.
  },

  'pf-visually-hidden': {
    html: `<p style="margin: 0">
  Read 4.6<pf-visually-hidden> out of 5 stars</pf-visually-hidden>
  <span aria-hidden="true">★★★★☆</span>
</p>`,
  },
};
