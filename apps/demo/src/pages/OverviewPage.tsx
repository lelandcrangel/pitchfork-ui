import { useState } from 'react';
import {
  Avatar,
  Badge,
  BarChart,
  Button,
  Card,
  CardContent,
  CardHeader,
  Icon,
  LineChart,
  MetricCard,
  MetricGrid,
  Modal,
  PageHeader,
  PieChart,
  SectionHeader,
  Select,
  Table,
  Tag,
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
        <Avatar name={s.name} size="sm" />
        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{s.name}</span>
      </div>
    ),
    email: <span style={{ color: 'var(--color-semantic-text-muted)', fontSize: 'var(--font-size-sm)' }}>{s.email}</span>,
    plan: <Badge variant={planColors[s.plan]}>{s.plan}</Badge>,
    status: <Tag variant={statusColors[s.status]}>{s.status}</Tag>,
    date: <span style={{ fontSize: 'var(--font-size-sm)' }}>{s.date}</span>,
    country: <span style={{ fontSize: 'var(--font-size-sm)' }}>{s.country}</span>,
    actions: (
      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(s)}>
        View
      </Button>
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
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onValueChange={setDateRange}
            />
            <Button variant="secondary">
              <Icon name="file-arrow-down" aria-hidden />
              Export
            </Button>
          </div>
        }
      />

      <MetricGrid>
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
      </MetricGrid>

      <div className="demo-grid-2">
        <Card>
          <CardHeader><SectionHeader heading="Sessions & Users" /></CardHeader>
          <CardContent>
            <LineChart
              data={monthlyData}
              series={[
                { key: 'sessions', label: 'Sessions' },
                { key: 'users', label: 'Users' },
              ]}
              yAxisLabel="Count"
              area
              curved
              valueFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionHeader heading="Traffic by Channel" /></CardHeader>
          <CardContent>
            <BarChart
              data={channelData}
              series={[{ key: 'visits', label: 'Visits' }]}
              yAxisLabel="Visits"
              showLegend={false}
              valueFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><SectionHeader heading="Device Breakdown" /></CardHeader>
        <CardContent style={{ display: 'flex', justifyContent: 'center' }}>
          <PieChart
            data={deviceData}
            size={200}
            centerLabel={<span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Devices</span>}
          />
        </CardContent>
      </Card>

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
        onOpenChange={(open) => { if (!open) setSelectedUser(null); }}
        title={selectedUser?.name}
        description={selectedUser?.email}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setSelectedUser(null)}>Close</Button>
        }
      >
        {selectedUser && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-1)' }}>Plan</div>
                <Badge variant={planColors[selectedUser.plan]}>{selectedUser.plan}</Badge>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-1)' }}>Status</div>
                <Tag variant={statusColors[selectedUser.status] as 'success' | 'warning' | 'neutral'}>{selectedUser.status}</Tag>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-1)' }}>Signed Up</div>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{selectedUser.date}</span>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-1)' }}>Country</div>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{selectedUser.country}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
