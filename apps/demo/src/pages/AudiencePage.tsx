import { useState } from 'react';
import { PfCard, PfCardContent, PfCardHeader, PfProgressBar } from '@pitchfork-ui/elements-react';
/*
 * TODO(pitchfork-ui): still on @pitchfork-ui/react, which is being retired.
 * Each of these needs the call site reshaped by hand -- see Foundations/Migrating in Storybook.
 *
 * - BarChart: the call site changes shape: series -> child elements
 * - PageHeader: the call site changes shape: eyebrow -> slot; description -> slot; metadata -> slot; actions -> slot; heading -> needs a destination
 * - RadarChart: the call site changes shape: data -> child elements
 * - SectionHeader: the call site changes shape: eyebrow -> slot; description -> slot; metadata -> slot; actions -> slot; heading -> needs a destination
 * - Select: the call site changes shape: options -> child elements; onValueChange -> no matching event on pf-select; pick the right one
 * - Table: the call site changes shape: caption -> slot; columns -> child elements; rows -> child elements; emptyState -> needs a destination; onSortStateChange -> no matching event on pf-table; pick the right one
 */
import {
  BarChart,
  PageHeader,
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
        <PfCard>
          <PfCardHeader>
            <SectionHeader heading="Session Depth" />
          </PfCardHeader>
          <PfCardContent>
            <BarChart
              data={sessionDepthData}
              series={[{ key: 'depth', label: 'Sessions' }]}
              yAxisLabel="Sessions"
              showLegend={false}
              valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
          </PfCardContent>
        </PfCard>

        <PfCard>
          <PfCardHeader>
            <SectionHeader heading="Content Interest" />
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={radarSingleSeries} size={240} />
          </PfCardContent>
        </PfCard>
      </div>

      <PfCard>
        <PfCardHeader>
          <SectionHeader
            heading="Goal Completion"
            description="Progress toward your conversion goals this period."
          />
        </PfCardHeader>
        <PfCardContent>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {goals.map((g) => (
              <PfProgressBar key={g.label} label={g.label} value={g.value} max={g.max} showValue />
            ))}
          </div>
        </PfCardContent>
      </PfCard>

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
