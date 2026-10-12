import { useState } from 'react';
import {
  PfAvatar,
  PfBadge,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfIcon,
  PfMetricGrid,
  PfTag,
} from '@pitchfork-ui/elements-react';
/*
 * TODO(pitchfork-ui): still on @pitchfork-ui/react, which is being retired.
 * Each of these needs the call site reshaped by hand -- see Foundations/Migrating in Storybook.
 *
 * - BarChart: the call site changes shape: series -> child elements
 * - LineChart: the call site changes shape: series -> child elements
 * - MetricCard: the call site changes shape: heading -> slot; description -> slot; icon -> slot; action -> slot; value -> needs a destination; trendLabel -> needs a destination
 * - Modal: the call site changes shape: title -> needs a destination; description -> needs a destination; footer -> needs a destination
 * - PageHeader: the call site changes shape: eyebrow -> slot; description -> slot; metadata -> slot; actions -> slot; heading -> needs a destination
 * - PieChart: the call site changes shape: data -> child elements; centerLabel -> needs a destination; emptyLabel -> needs a destination
 * - SectionHeader: the call site changes shape: eyebrow -> slot; description -> slot; metadata -> slot; actions -> slot; heading -> needs a destination
 * - Select: the call site changes shape: options -> child elements; onValueChange -> no matching event on pf-select; pick the right one
 * - Table: the call site changes shape: caption -> slot; columns -> child elements; rows -> child elements; emptyState -> needs a destination; onSortStateChange -> no matching event on pf-table; pick the right one
 */
import {
  BarChart,
  LineChart,
  MetricCard,
  Modal,
  PageHeader,
  PieChart,
  SectionHeader,
  Select,
  Table,
} from '@pitchfork-ui/react';
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

  const tableRows = recentSignups.map((s) => ({
    user: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <PfAvatar name={s.name} size="sm" />
        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{s.name}</span>
      </div>
    ),
    email: (
      <span style={{ color: 'var(--color-semantic-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        {s.email}
      </span>
    ),
    plan: <PfBadge variant={planColors[s.plan]}>{s.plan}</PfBadge>,
    status: <PfTag variant={statusColors[s.status]}>{s.status}</PfTag>,
    date: <span style={{ fontSize: 'var(--font-size-sm)' }}>{s.date}</span>,
    country: <span style={{ fontSize: 'var(--font-size-sm)' }}>{s.country}</span>,
    actions: (
      <PfButton variant="ghost" size="sm" onClick={() => setSelectedUser(s)}>
        View
      </PfButton>
    ),
  }));

  const tableColumns = [
    { key: 'user', header: 'User' },
    { key: 'email', header: 'Email' },
    { key: 'plan', header: 'Plan', align: 'center' as const },
    { key: 'status', header: 'Status', align: 'center' as const },
    { key: 'date', header: 'Signed Up' },
    { key: 'country', header: 'Country' },
    { key: 'actions', header: '', align: 'right' as const },
  ];

  return (
    <div className="demo-section" style={{ gap: 'var(--space-6)' }}>
      <PageHeader
        heading="Overview"
        description="Track your key metrics and performance at a glance."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} />
            <PfButton variant="secondary">
              <PfIcon name="file-arrow-down" aria-hidden />
              Export
            </PfButton>
          </div>
        }
      />

      <PfMetricGrid>
        {kpiMetrics.map((m) => (
          <MetricCard
            key={m.heading}
            heading={m.heading}
            value={m.value}
            trendLabel={m.trendLabel}
            trend={m.trend}
            description={m.description}
            iconName={m.iconName}
          />
        ))}
      </PfMetricGrid>

      <div className="demo-grid-2">
        <PfCard>
          <PfCardHeader>
            <SectionHeader heading="Sessions & Users" />
          </PfCardHeader>
          <PfCardContent>
            <LineChart
              data={monthlyData}
              series={[
                { key: 'sessions', label: 'Sessions' },
                { key: 'users', label: 'Users' },
              ]}
              yAxisLabel="Count"
              area
              curved
              valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
          </PfCardContent>
        </PfCard>

        <PfCard>
          <PfCardHeader>
            <SectionHeader heading="Traffic by Channel" />
          </PfCardHeader>
          <PfCardContent>
            <BarChart
              data={channelData}
              series={[{ key: 'visits', label: 'Visits' }]}
              yAxisLabel="Visits"
              showLegend={false}
              valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
          </PfCardContent>
        </PfCard>
      </div>

      <PfCard>
        <PfCardHeader>
          <SectionHeader heading="Device Breakdown" />
        </PfCardHeader>
        <PfCardContent style={{ display: 'flex', justifyContent: 'center' }}>
          <PieChart
            data={deviceData}
            size={200}
            centerLabel={
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                Devices
              </span>
            }
          />
        </PfCardContent>
      </PfCard>

      <div>
        <SectionHeader
          heading="Recent Signups"
          description="Latest users who created an account."
          divider
          style={{ marginBottom: 'var(--space-4)' }}
        />
        <Table
          columns={tableColumns}
          rows={tableRows}
          striped
          hoverable
          getRowKey={(_, i) => String(i)}
        />
      </div>

      <Modal
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        title={selectedUser?.name}
        description={selectedUser?.email}
        size="sm"
        footer={
          <PfButton variant="secondary" onClick={() => setSelectedUser(null)}>
            Close
          </PfButton>
        }
      >
        {selectedUser && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-semantic-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Plan
                </div>
                <PfBadge variant={planColors[selectedUser.plan]}>{selectedUser.plan}</PfBadge>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-semantic-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Status
                </div>
                <PfTag
                  variant={statusColors[selectedUser.status] as 'success' | 'warning' | 'neutral'}
                >
                  {selectedUser.status}
                </PfTag>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-semantic-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Signed Up
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{selectedUser.date}</span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-semantic-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Country
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{selectedUser.country}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
