import { sortRowsBy, type SortDirection } from '@pitchfork-ui/core';
import type { Pattern } from './PatternPreview';

/**
 * The seven worked compositions, as the markup a consumer would write.
 *
 * One file for the same reason `element-examples.ts` is one file: the story,
 * the "Show code" panel and `check:examples` all read it, so none of them can
 * describe a composition the others do not render.
 *
 * Four are static. Three are not, and that is the interesting part — a
 * library of custom elements is wired with events and properties rather than
 * with a framework's state, and these are what that actually looks like.
 */
export const patternMarkup: Record<string, Pattern> = {
  'login-form': {
    html: `<pf-card style="max-width: 400px; width: 100%">
  <pf-card-header>
    <h2 style="margin: 0; font-size: 1.25rem">Sign in</h2>
    <p style="margin: 4px 0 0; color: var(--color-semantic-text-muted)">
      Welcome back — enter your details to continue.
    </p>
  </pf-card-header>
  <pf-card-content style="display: grid; gap: 16px">
    <pf-input label="Email" type="email" placeholder="you@example.com"></pf-input>
    <pf-input label="Password" type="password" placeholder="••••••••"></pf-input>
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px">
      <pf-checkbox label="Remember me"></pf-checkbox>
      <pf-button variant="ghost" size="sm">Forgot password?</pf-button>
    </div>
    <pf-button full-width>Sign in</pf-button>
    <pf-content-divider>or</pf-content-divider>
    <pf-button variant="secondary" full-width>Continue with Google</pf-button>
  </pf-card-content>
  <pf-card-footer>
    <span style="color: var(--color-semantic-text-muted); font-size: 0.875rem">
      Don't have an account? <a href="#">Sign up</a>
    </span>
  </pf-card-footer>
</pf-card>`,
  },

  'dashboard-card': {
    html: `<pf-card style="max-width: 760px; width: 100%">
  <pf-card-header
    style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap"
  >
    <div>
      <h2 style="margin: 0; font-size: 1.25rem">Revenue overview</h2>
      <p style="margin: 4px 0 0; color: var(--color-semantic-text-muted)">Last 30 days</p>
    </div>
    <pf-badge variant="success">+12.5%</pf-badge>
  </pf-card-header>
  <pf-card-content>
    <pf-metric-grid>
      <pf-metric-card trend="positive">
        <span slot="heading">Revenue</span>
        $48,210
        <span slot="trend">12.5%</span>
        <pf-sparkline
          label="Revenue trend"
          variant="area"
          end-dot
          width="140"
          height="36"
          data="[32, 35, 33, 40, 38, 45, 44, 52, 50, 58, 61, 67]"
        ></pf-sparkline>
      </pf-metric-card>
      <pf-metric-card trend="positive">
        <span slot="heading">Active users</span>
        3,492
        <span slot="trend">8.1%</span>
        <pf-sparkline
          label="Active users trend"
          color="var(--color-success-500)"
          end-dot
          width="140"
          height="36"
          data="[120, 128, 126, 135, 140, 138, 150, 156, 161, 168, 172, 180]"
        ></pf-sparkline>
      </pf-metric-card>
      <pf-metric-card trend="negative">
        <span slot="heading">Churn</span>
        1.8%
        <span slot="trend">0.4%</span>
        <pf-sparkline
          label="Churn trend"
          color="var(--color-danger-500)"
          end-dot
          width="140"
          height="36"
          data="[28, 26, 27, 24, 22, 23, 20, 19, 18, 17, 16, 15]"
        ></pf-sparkline>
      </pf-metric-card>
    </pf-metric-grid>
  </pf-card-content>
  <pf-card-footer style="display: flex; align-items: center; justify-content: space-between">
    <span style="color: var(--color-semantic-text-muted); font-size: 0.875rem">
      Updated 2 minutes ago
    </span>
    <pf-button variant="ghost" size="sm">View full report</pf-button>
  </pf-card-footer>
</pf-card>`,
  },

  'pricing-cards': {
    html: `<div
  style="display: grid; gap: 16px; width: 100%; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))"
>
  <pf-card>
    <pf-card-header>
      <h3 style="margin: 0; font-size: 1rem">Starter</h3>
      <p style="margin: 8px 0 0; font-size: 1.75rem; font-weight: 700">Free</p>
      <p style="margin: 8px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
        One project, community support.
      </p>
    </pf-card-header>
    <pf-card-content>
      <ul style="margin: 0; padding: 0; list-style: none; display: grid; gap: 8px">
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> One project
        </li>
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Community support
        </li>
      </ul>
    </pf-card-content>
    <pf-card-footer>
      <pf-button variant="secondary" full-width>Get started</pf-button>
    </pf-card-footer>
  </pf-card>

  <pf-card>
    <pf-card-header>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
        <h3 style="margin: 0; font-size: 1rem">Pro</h3>
        <pf-badge variant="brand">Recommended</pf-badge>
      </div>
      <p style="margin: 8px 0 0; font-size: 1.75rem; font-weight: 700">
        £19 <span style="font-size: 0.875rem; font-weight: 400">/ month</span>
      </p>
      <p style="margin: 8px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
        Everything in Starter, without the limits.
      </p>
    </pf-card-header>
    <pf-card-content>
      <ul style="margin: 0; padding: 0; list-style: none; display: grid; gap: 8px">
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Unlimited projects
        </li>
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Email support
        </li>
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Usage analytics
        </li>
      </ul>
    </pf-card-content>
    <pf-card-footer>
      <pf-button full-width>Start a trial</pf-button>
    </pf-card-footer>
  </pf-card>

  <pf-card>
    <pf-card-header>
      <h3 style="margin: 0; font-size: 1rem">Team</h3>
      <p style="margin: 8px 0 0; font-size: 1.75rem; font-weight: 700">
        £49 <span style="font-size: 0.875rem; font-weight: 400">/ month</span>
      </p>
      <p style="margin: 8px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
        For teams that need roles and audit trails.
      </p>
    </pf-card-header>
    <pf-card-content>
      <ul style="margin: 0; padding: 0; list-style: none; display: grid; gap: 8px">
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Everything in Pro
        </li>
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Roles and permissions
        </li>
        <li style="display: flex; align-items: center; gap: 8px">
          <pf-icon name="circle-check"></pf-icon> Audit log
        </li>
      </ul>
    </pf-card-content>
    <pf-card-footer>
      <pf-button variant="secondary" full-width>Contact sales</pf-button>
    </pf-card-footer>
  </pf-card>
</div>`,
  },

  // `pf-tabs` owns which panel shows, through its own `value`, so the tabs
  // need no wiring at all -- which is the point worth noticing here. Each
  // `pf-switch` likewise keeps its own state.
  'settings-page': {
    html: `<div style="max-width: 720px; width: 100%">
  <pf-section-header divider>
    Settings
    <span slot="description">Manage your profile, workspace and notifications.</span>
  </pf-section-header>

  <pf-tabs value="profile" style="width: 100%">
    <pf-tab value="profile">Profile</pf-tab>
    <pf-tab-panel value="profile">
      <div style="display: grid; gap: 16px; padding-top: 16px">
        <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
          <pf-input label="First name" value="John"></pf-input>
          <pf-input label="Last name" value="Smith"></pf-input>
        </div>
        <pf-input label="Display name" value="johnsmith"></pf-input>
        <pf-input label="Email address" type="email" value="john@example.com"></pf-input>
        <pf-select label="Language" value="en">
          <pf-option value="en">English</pf-option>
          <pf-option value="es">Español</pf-option>
          <pf-option value="fr">Français</pf-option>
          <pf-option value="de">Deutsch</pf-option>
        </pf-select>
        <pf-textarea
          label="Bio"
          description="Brief description visible on your public profile."
          placeholder="Tell us about yourself…"
        ></pf-textarea>
      </div>
    </pf-tab-panel>

    <pf-tab value="workspace">Workspace</pf-tab>
    <pf-tab-panel value="workspace">
      <div style="display: grid; gap: 16px; padding-top: 16px">
        <pf-input label="Workspace name" value="Acme Labs"></pf-input>
        <pf-select label="Default role" value="member">
          <pf-option value="member">Member</pf-option>
          <pf-option value="admin">Admin</pf-option>
          <pf-option value="viewer">Viewer</pf-option>
        </pf-select>
        <pf-content-divider></pf-content-divider>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">
          <div>
            <p style="margin: 0">Require two-factor authentication</p>
            <p style="margin: 2px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
              Everyone in the workspace must enrol.
            </p>
          </div>
          <pf-switch label="Require two-factor authentication" checked></pf-switch>
        </div>
      </div>
    </pf-tab-panel>

    <pf-tab value="notifications">Notifications</pf-tab>
    <pf-tab-panel value="notifications">
      <div style="display: grid; gap: 16px; padding-top: 16px">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">
          <div>
            <p style="margin: 0">Product updates</p>
            <p style="margin: 2px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
              Occasional notes about new features.
            </p>
          </div>
          <pf-switch label="Product updates" checked></pf-switch>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">
          <div>
            <p style="margin: 0">Weekly digest</p>
            <p style="margin: 2px 0 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">
              A summary every Monday morning.
            </p>
          </div>
          <pf-switch label="Weekly digest"></pf-switch>
        </div>
      </div>
    </pf-tab-panel>
  </pf-tabs>

  <pf-section-footer>
    Changes save when you press Save.
    <pf-button slot="actions">Save changes</pf-button>
  </pf-section-footer>
</div>`,
  },

  // Interactive, and the wiring is the documentation: a card whose brand
  // follows what you type, through `pfInput` and three properties.
  'checkout-form': {
    html: `<div style="max-width: 460px; width: 100%; margin: 0 auto">
  <pf-card>
    <pf-card-header>
      <div style="display: flex; justify-content: center; margin-bottom: 8px">
        <pf-credit-card
          brand="visa"
          card-number="4242424242424242"
          cardholder-name="JOHN SMITH"
          expiry="08/27"
          cvc="123"
        ></pf-credit-card>
      </div>
    </pf-card-header>
    <pf-card-content>
      <div style="display: grid; gap: 16px">
        <pf-input label="Card number" name="number" value="4242 4242 4242 4242"></pf-input>
        <pf-input label="Cardholder name" name="name" value="John Smith"></pf-input>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
          <pf-input label="Expiry" name="expiry" value="08/27" placeholder="MM/YY"></pf-input>
          <pf-input label="CVC" name="cvc" value="123"></pf-input>
        </div>
        <pf-select label="Country" name="country" value="us">
          <pf-option value="us">United States</pf-option>
          <pf-option value="gb">United Kingdom</pf-option>
          <pf-option value="de">Germany</pf-option>
        </pf-select>
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 4px">
          <p style="margin: 0; color: var(--color-semantic-text-muted); font-size: 0.875rem">Total</p>
          <p style="margin: 0; font-size: 1.125rem; font-weight: 700">£48.00</p>
        </div>
        <pf-button full-width>Pay £48.00</pf-button>
      </div>
    </pf-card-content>
  </pf-card>
</div>`,
    setup: (root) => {
      const card = root.querySelector('pf-credit-card') as HTMLElement & {
        brand?: string;
        cardNumber?: string;
        cardholderName?: string;
        expiry?: string;
        cvc?: string;
      };
      const brandOf = (digits: string) => {
        if (/^4/.test(digits)) return 'visa';
        if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
        if (/^3[47]/.test(digits)) return 'amex';
        return 'generic';
      };

      // `pfInput` carries the value in `detail.value`. Writing it back to the
      // control is what makes the formatting stick as you type -- the element
      // holds its own value, so nothing else will do it.
      root.addEventListener('pfInput', (event) => {
        const target = event.target as HTMLElement & { name?: string; value?: string };
        const raw = (event as CustomEvent<{ value: string }>).detail?.value ?? '';

        if (target.name === 'number') {
          const digits = raw.replace(/\D/g, '').slice(0, 16);
          target.value = digits.replace(/(.{4})/g, '$1 ').trim();
          card.cardNumber = digits;
          card.brand = brandOf(digits);
        }
        if (target.name === 'name') card.cardholderName = raw.toUpperCase();
        if (target.name === 'expiry') {
          const digits = raw.replace(/\D/g, '').slice(0, 4);
          target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
          card.expiry = target.value;
        }
        if (target.name === 'cvc') card.cvc = raw.replace(/\D/g, '').slice(0, 4);
      });
    },
  },

  // Interactive, and the one that shows the rule `pf-table` is built on: the
  // element reports a sort and does not reorder anything. Moving rows is the
  // consumer's job, with the same comparator the React `Table` uses so both
  // produce the same order.
  'data-table': {
    html: `<div style="max-width: 760px; width: 100%">
  <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 16px">
    <pf-input label="Search" name="query" placeholder="Search invoices or customers"></pf-input>
    <pf-select label="Status" name="status" value="all">
      <pf-option value="all">All statuses</pf-option>
      <pf-option value="paid">Paid</pf-option>
      <pf-option value="pending">Pending</pf-option>
      <pf-option value="overdue">Overdue</pf-option>
    </pf-select>
  </div>

  <pf-table label="Invoices" striped sort-key="invoice" sort-direction="asc" style="width: 100%">
    <span slot="empty">No invoices match your filters.</span>
    <pf-table-row head>
      <pf-table-cell head sortable sort-key="invoice" sort="ascending">Invoice</pf-table-cell>
      <pf-table-cell head sortable sort-key="customer">Customer</pf-table-cell>
      <pf-table-cell head sortable sort-key="amount" align="right">Amount</pf-table-cell>
      <pf-table-cell head>Status</pf-table-cell>
    </pf-table-row>
  </pf-table>

  <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px">
    <span data-count style="color: var(--color-semantic-text-muted); font-size: 0.875rem"></span>
    <pf-pagination page="1" total-pages="1"></pf-pagination>
  </div>
</div>`,
    setup: (root) => {
      // `sortRowsBy` and `compareSortValues` come from @pitchfork-ui/core, so
      // the order here matches what the React Table produces for itself.
      const invoices = [
        { invoice: 'INV-1043', customer: 'Acme Labs', amount: 2440, status: 'paid' },
        { invoice: 'INV-1042', customer: 'Northstar Health', amount: 9150, status: 'pending' },
        { invoice: 'INV-1041', customer: 'Solaris Group', amount: 1290, status: 'overdue' },
        { invoice: 'INV-1040', customer: 'Parallel Works', amount: 3620, status: 'pending' },
        { invoice: 'INV-1039', customer: 'Borealis Ops', amount: 4830, status: 'paid' },
        { invoice: 'INV-1038', customer: 'Lumen Retail', amount: 7010, status: 'pending' },
        { invoice: 'INV-1037', customer: 'Vantage Co.', amount: 540, status: 'paid' },
        { invoice: 'INV-1036', customer: 'Cinder Studio', amount: 3005, status: 'overdue' },
        { invoice: 'INV-1035', customer: 'Quartz Media', amount: 1875, status: 'paid' },
        { invoice: 'INV-1034', customer: 'Halcyon Inc', amount: 6240, status: 'pending' },
      ];
      const badge: Record<string, [string, string]> = {
        paid: ['Paid', 'success'],
        pending: ['Pending', 'brand'],
        overdue: ['Overdue', 'warning'],
      };
      const PAGE_SIZE = 4;

      const table = root.querySelector('pf-table') as HTMLElement & {
        sortKey?: string;
        sortDirection?: SortDirection;
      };
      const head = root.querySelector('pf-table-row[head]')!;
      const pagination = root.querySelector('pf-pagination') as HTMLElement & {
        page?: number;
        totalPages?: number;
      };
      const count = root.querySelector('[data-count]')!;

      let query = '';
      let status = 'all';
      let sort: { key: string; direction: SortDirection } = { key: 'invoice', direction: 'asc' };
      let page = 1;

      const draw = () => {
        const needle = query.trim().toLowerCase();
        const filtered = invoices.filter(
          (row) =>
            (status === 'all' || row.status === status) &&
            (!needle ||
              row.invoice.toLowerCase().includes(needle) ||
              row.customer.toLowerCase().includes(needle)),
        );
        const ordered = sortRowsBy(
          filtered,
          (row) => row[sort.key as keyof typeof row],
          sort.direction,
        );
        const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
        page = Math.min(page, totalPages);
        const shown = ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

        // The header row stays; only the body is replaced.
        for (const row of [...root.querySelectorAll('pf-table-row:not([head])')]) row.remove();
        shown.forEach((row, index) => {
          const [label, variant] = badge[row.status];
          const tr = document.createElement('pf-table-row');
          if (index % 2 === 1) tr.setAttribute('odd', '');
          if (index === shown.length - 1) tr.setAttribute('last', '');
          tr.innerHTML = `<pf-table-cell>${row.invoice}</pf-table-cell>
<pf-table-cell>${row.customer}</pf-table-cell>
<pf-table-cell align="right">£${row.amount.toLocaleString('en-GB')}</pf-table-cell>
<pf-table-cell><pf-badge variant="${variant}">${label}</pf-badge></pf-table-cell>`;
          table.append(tr);
        });

        count.textContent = `${ordered.length} ${ordered.length === 1 ? 'invoice' : 'invoices'}`;
        pagination.page = page;
        pagination.totalPages = totalPages;
      };

      root.addEventListener('pfInput', (event) => {
        const target = event.target as HTMLElement & { name?: string };
        if (target.name !== 'query') return;
        query = (event as CustomEvent<{ value: string }>).detail?.value ?? '';
        page = 1;
        draw();
      });

      root.addEventListener('pfChange', (event) => {
        const target = event.target as HTMLElement & { name?: string };
        if (target.name !== 'status') return;
        status = (event as CustomEvent<{ value: string }>).detail?.value ?? 'all';
        page = 1;
        draw();
      });

      // The element announces which column and direction a reader asked for.
      // Reordering the rows is what this handler is for.
      root.addEventListener('pfSortChange', (event) => {
        const detail = (event as CustomEvent<{ key: string; direction: SortDirection }>).detail;
        if (!detail) return;
        sort = { key: detail.key, direction: detail.direction };
        head.querySelectorAll('pf-table-cell[sortable]').forEach((cell) => {
          const own = cell.getAttribute('sort-key') === detail.key;
          cell.setAttribute(
            'sort',
            own ? (detail.direction === 'asc' ? 'ascending' : 'descending') : 'none',
          );
        });
        draw();
      });

      root.addEventListener('pfPageChange', (event) => {
        page = (event as CustomEvent<{ page: number }>).detail?.page ?? 1;
        draw();
      });

      draw();
    },
  },

  // Interactive: a modal that stays open while its steps advance.
  'multi-step-wizard': {
    html: `<pf-button data-open>Set up your account</pf-button>
<pf-modal label="Set up your account" size="lg">
  <pf-modal-header><strong>Set up your account</strong></pf-modal-header>
  <pf-modal-body>
    <pf-progress-steps style="width: 100%; margin-bottom: 20px">
      <pf-progress-step state="current" position="1">
        <span slot="title">Account</span>
      </pf-progress-step>
      <pf-progress-step state="upcoming" position="2">
        <span slot="title">Workspace</span>
      </pf-progress-step>
      <pf-progress-step state="upcoming" position="3" last>
        <span slot="title">Preferences</span>
      </pf-progress-step>
    </pf-progress-steps>

    <div data-step="0" style="display: grid; gap: 16px">
      <pf-input label="Full name" value="John Smith"></pf-input>
      <pf-input label="Email address" type="email" value="john@example.com"></pf-input>
    </div>
    <div data-step="1" hidden style="display: grid; gap: 16px">
      <pf-input label="Workspace name" value="Acme Labs"></pf-input>
      <pf-select label="Team size" value="2-10">
        <pf-option value="1">Just me</pf-option>
        <pf-option value="2-10">2–10</pf-option>
        <pf-option value="11-50">11–50</pf-option>
      </pf-select>
    </div>
    <div data-step="2" hidden style="display: grid; gap: 16px">
      <pf-textarea label="What are you building?" placeholder="A sentence is plenty…"></pf-textarea>
      <pf-switch label="Send me product updates" checked></pf-switch>
    </div>
  </pf-modal-body>
  <pf-modal-footer>
    <div style="display: flex; justify-content: space-between; width: 100%; gap: 8px">
      <pf-button variant="ghost" data-cancel>Cancel</pf-button>
      <div style="display: flex; gap: 8px">
        <pf-button variant="secondary" data-back disabled>Back</pf-button>
        <pf-button data-next>Next</pf-button>
      </div>
    </div>
  </pf-modal-footer>
</pf-modal>`,
    setup: (root) => {
      const modal = root.querySelector('pf-modal') as HTMLElement & { open?: boolean };
      const panels = [...root.querySelectorAll<HTMLElement>('[data-step]')];
      const steps = [...root.querySelectorAll('pf-progress-step')];
      const back = root.querySelector('[data-back]') as HTMLElement & { disabled?: boolean };
      const next = root.querySelector('[data-next]')!;
      const last = panels.length - 1;
      let step = 0;

      const draw = () => {
        panels.forEach((panel, index) => panel.toggleAttribute('hidden', index !== step));
        steps.forEach((node, index) => {
          node.setAttribute(
            'state',
            index < step ? 'complete' : index === step ? 'current' : 'upcoming',
          );
        });
        back.disabled = step === 0;
        next.textContent = step === last ? 'Finish' : 'Next';
      };

      root.querySelector('[data-open]')?.addEventListener('click', () => {
        step = 0;
        draw();
        modal.open = true;
      });
      root.querySelector('[data-cancel]')?.addEventListener('click', () => {
        modal.open = false;
      });
      back.addEventListener('click', () => {
        if (step > 0) step -= 1;
        draw();
      });
      next.addEventListener('click', () => {
        if (step === last) {
          modal.open = false;
          return;
        }
        step += 1;
        draw();
      });

      draw();
    },
  },
};
