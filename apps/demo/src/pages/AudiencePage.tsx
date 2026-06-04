import { useState } from 'react';
import {
  BarChart,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  ProgressBar,
  RadarChart,
  SectionHeader,
  Select,
  Table,
} from '@pitchfork-ui/react';
import { goals, radarData, sessionDepthData, topPages } from '../data/mockData';

const dateRangeOptions = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'This year' },
];

const topPageColumns = [
  { key: 'page', header: 'Page' },
  { key: 'views', header: 'Views', align: 'right' as const },
  { key: 'unique', header: 'Unique', align: 'right' as const },
  { key: 'bounce', header: 'Bounce %', align: 'right' as const },
  { key: 'avgTime', header: 'Avg. Time', align: 'right' as const },
];

const radarSingleSeries = radarData.map((d) => ({ label: d.label, value: d.thisMonth }));

export function AudiencePage() {
  const [dateRange, setDateRange] = useState('30d');

  const topPageRows = topPages.map((p) => ({
    page: (
      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
        {p.page}
      </span>
    ),
    views: <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.views.toLocaleString()}</span>,
    unique: <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.unique.toLocaleString()}</span>,
    bounce: (
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: p.bounce > 50 ? 'var(--color-semantic-text-danger)' : 'inherit',
        }}
      >
        {p.bounce}%
      </span>
    ),
    avgTime: <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.avgTime}</span>,
  }));

  return (
    <div className="demo-section" style={{ gap: 'var(--space-6)' }}>
      <PageHeader
        heading="Audience"
        description="Understand who your visitors are and how they engage."
        actions={
          <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} />
        }
      />

      <div className="demo-grid-2">
        <Card>
          <CardHeader>
            <SectionHeader heading="Session Depth" />
          </CardHeader>
          <CardContent>
            <BarChart
              data={sessionDepthData}
              series={[{ key: 'depth', label: 'Sessions' }]}
              yAxisLabel="Sessions"
              showLegend={false}
              valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader heading="Content Interest" />
          </CardHeader>
          <CardContent style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={radarSingleSeries} size={240} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader
            heading="Goal Completion"
            description="Progress toward your conversion goals this period."
          />
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {goals.map((g) => (
              <ProgressBar key={g.label} label={g.label} value={g.value} max={g.max} showValue />
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <SectionHeader
          heading="Top Pages"
          description="Most visited pages ranked by total views."
          divider
          style={{ marginBottom: 'var(--space-4)' }}
        />
        <Table
          columns={topPageColumns}
          rows={topPageRows}
          striped
          hoverable
          getRowKey={(_, i) => String(i)}
        />
      </div>
    </div>
  );
}
