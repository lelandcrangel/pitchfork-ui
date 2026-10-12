import { useState } from 'react';
import {
  PfAvatar,
  PfBadge,
  PfBarChart,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfChartSeries,
  PfIcon,
  PfLineChart,
  PfMetricCard,
  PfMetricGrid,
  PfModal,
  PfModalBody,
  PfModalFooter,
  PfModalHeader,
  PfOption,
  PfPageHeader,
  PfPieChart,
  PfPieSlice,
  PfSectionHeader,
  PfSelect,
  PfTable,
  PfTableCell,
  PfTableRow,
  PfTag,
} from '@pitchfork-ui/elements-react';
import {
  channelData,
  deviceData,
  kpiMetrics,
  monthlyData,
  recentSignups,
  type Signup,
} from '../data/mockData';

const dateRangeOptions = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'This year' },
];

const planColors: Record<Signup['plan'], 'brand' | 'neutral' | 'success'> = {
  Free: 'neutral',
  Pro: 'brand',
  Enterprise: 'success',
};

const statusColors: Record<Signup['status'], 'success' | 'warning' | 'neutral'> = {
  Active: 'success',
  Pending: 'warning',
  Churned: 'neutral',
};

export function OverviewPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedUser, setSelectedUser] = useState<Signup | null>(null);

  const small = (value: string) => <span style={{ fontSize: 'var(--font-size-sm)' }}>{value}</span>;

  const tableColumns = [
    { key: 'user', header: 'User', align: 'left' as const },
    { key: 'email', header: 'Email', align: 'left' as const },
    { key: 'plan', header: 'Plan', align: 'center' as const },
    { key: 'status', header: 'Status', align: 'center' as const },
    { key: 'date', header: 'Signed Up', align: 'left' as const },
    { key: 'country', header: 'Country', align: 'left' as const },
    { key: 'actions', header: '', align: 'right' as const },
  ];

  return (
    <div className="demo-section" style={{ gap: 'var(--space-6)' }}>
      <PfPageHeader>
        Overview
        <span slot="description">Track your key metrics and performance at a glance.</span>
        <div
          slot="actions"
          style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}
        >
          <PfSelect value={dateRange} onPfChange={(event) => setDateRange(event.detail.value)}>
            {dateRangeOptions.map((option) => (
              <PfOption key={option.value} value={option.value}>
                {option.label}
              </PfOption>
            ))}
          </PfSelect>
          <PfButton variant="secondary">
            <PfIcon name="file-arrow-down" aria-hidden />
            Export
          </PfButton>
        </div>
      </PfPageHeader>

      {/*
       * `pf-metric-card` puts the value in its **default** slot and everything
       * else in a named one -- the heading, the trend and the description each
       * have their own, where the React `MetricCard` took all four as props.
       * `iconName` is just `icon` here, a name the element resolves itself.
       */}
      <PfMetricGrid>
        {kpiMetrics.map((m) => (
          <PfMetricCard key={m.heading} icon={m.iconName} trend={m.trend}>
            <span slot="heading">{m.heading}</span>
            {m.value}
            <span slot="trend">{m.trendLabel}</span>
            <span slot="description">{m.description}</span>
          </PfMetricCard>
        ))}
      </PfMetricGrid>

      <div className="demo-grid-2">
        <PfCard>
          <PfCardHeader>
            <PfSectionHeader>Sessions &amp; Users</PfSectionHeader>
          </PfCardHeader>
          <PfCardContent>
            <PfLineChart
              label="Sessions and users by month"
              data={monthlyData}
              yAxisLabel="Count"
              area
              curved
              style={{ width: '100%' }}
            >
              <PfChartSeries seriesKey="sessions">Sessions</PfChartSeries>
              <PfChartSeries seriesKey="users">Users</PfChartSeries>
            </PfLineChart>
          </PfCardContent>
        </PfCard>

        <PfCard>
          <PfCardHeader>
            <PfSectionHeader>Traffic by Channel</PfSectionHeader>
          </PfCardHeader>
          <PfCardContent>
            <PfBarChart
              label="Visits by channel"
              data={channelData}
              yAxisLabel="Visits"
              showLegend={false}
              style={{ width: '100%' }}
            >
              <PfChartSeries seriesKey="visits">Visits</PfChartSeries>
            </PfBarChart>
          </PfCardContent>
        </PfCard>
      </div>

      <PfCard>
        <PfCardHeader>
          <PfSectionHeader>Device Breakdown</PfSectionHeader>
        </PfCardHeader>
        <PfCardContent style={{ display: 'flex', justifyContent: 'center' }}>
          {/*
           * One `pf-pie-slice` per slice, each rendering its own legend row:
           * a legend in the chart's shadow root could never reach a label that
           * lives in the light DOM, so the chart pushes down the two things
           * only it knows -- the colour and the share.
           */}
          <PfPieChart label="Sessions by device" size={200}>
            {deviceData.map((d) => (
              <PfPieSlice key={d.label} value={d.value} color={d.color}>
                {d.label}
              </PfPieSlice>
            ))}
            <span
              slot="center"
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              Devices
            </span>
          </PfPieChart>
        </PfCardContent>
      </PfCard>

      <div>
        <PfSectionHeader divider style={{ marginBottom: 'var(--space-4)' }}>
          Recent Signups
          <span slot="description">Latest users who created an account.</span>
        </PfSectionHeader>

        <PfTable label="Recent signups" striped hoverable style={{ width: '100%' }}>
          <PfTableRow head>
            {tableColumns.map((column) => (
              <PfTableCell key={column.key} head align={column.align}>
                {column.header}
              </PfTableCell>
            ))}
          </PfTableRow>
          {recentSignups.map((s) => (
            <PfTableRow key={s.id}>
              <PfTableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <PfAvatar name={s.name} size="sm" />
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{s.name}</span>
                </div>
              </PfTableCell>
              <PfTableCell>
                <span
                  style={{
                    color: 'var(--color-semantic-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {s.email}
                </span>
              </PfTableCell>
              <PfTableCell align="center">
                <PfBadge variant={planColors[s.plan]}>{s.plan}</PfBadge>
              </PfTableCell>
              <PfTableCell align="center">
                <PfTag variant={statusColors[s.status]}>{s.status}</PfTag>
              </PfTableCell>
              <PfTableCell>{small(s.date)}</PfTableCell>
              <PfTableCell>{small(s.country)}</PfTableCell>
              <PfTableCell align="right">
                <PfButton variant="ghost" size="sm" onClick={() => setSelectedUser(s)}>
                  View
                </PfButton>
              </PfTableCell>
            </PfTableRow>
          ))}
        </PfTable>
      </div>

      {/*
       * `pf-modal` is a native `<dialog>` opened with `showModal()`, so the
       * focus trap, Escape and the backdrop come from the platform. Its
       * `title`/`description`/`footer` props become `pf-modal-header`,
       * `pf-modal-body` and `pf-modal-footer` children, and `label` is what
       * names the dialog.
       *
       * `pfOpenChange` comes from the element's own `@Watch`, which is the one
       * place every path passes through -- a listener on the DOM `close` event
       * fires for the browser-driven path and none of the user-driven ones.
       * So Escape and the backdrop clear the selection here, not just Close.
       */}
      <PfModal
        open={selectedUser !== null}
        label={selectedUser?.name}
        size="sm"
        onPfOpenChange={(event) => {
          if (!event.detail.open) setSelectedUser(null);
        }}
      >
        {selectedUser && (
          <>
            <PfModalHeader>
              <strong>{selectedUser.name}</strong>
              <div
                style={{
                  color: 'var(--color-semantic-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {selectedUser.email}
              </div>
            </PfModalHeader>
            <PfModalBody>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div className="demo-field-label">Plan</div>
                  <PfBadge variant={planColors[selectedUser.plan]}>{selectedUser.plan}</PfBadge>
                </div>
                <div>
                  <div className="demo-field-label">Status</div>
                  <PfTag variant={statusColors[selectedUser.status]}>{selectedUser.status}</PfTag>
                </div>
                <div>
                  <div className="demo-field-label">Signed Up</div>
                  {small(selectedUser.date)}
                </div>
                <div>
                  <div className="demo-field-label">Country</div>
                  {small(selectedUser.country)}
                </div>
              </div>
            </PfModalBody>
            <PfModalFooter>
              <PfButton variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
              </PfButton>
            </PfModalFooter>
          </>
        )}
      </PfModal>
    </div>
  );
}
