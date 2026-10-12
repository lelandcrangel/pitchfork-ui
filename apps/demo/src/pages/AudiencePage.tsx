import { useState } from 'react';
import {
  PfBarChart,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfChartSeries,
  PfOption,
  PfPageHeader,
  PfProgressBar,
  PfRadarAxis,
  PfRadarChart,
  PfSectionHeader,
  PfSelect,
  PfTable,
  PfTableCell,
  PfTableRow,
} from '@pitchfork-ui/elements-react';
import { goals, radarData, sessionDepthData, topPages } from '../data/mockData';

const dateRangeOptions = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'This year' },
];

const topPageColumns = [
  { key: 'page', header: 'Page', align: 'left' as const },
  { key: 'views', header: 'Views', align: 'right' as const },
  { key: 'unique', header: 'Unique', align: 'right' as const },
  { key: 'bounce', header: 'Bounce %', align: 'right' as const },
  { key: 'avgTime', header: 'Avg. Time', align: 'right' as const },
];

/*
 * The rows stay a property -- bulk numbers with no identity -- while the
 * series, which have names and colours, become `pf-chart-series` children.
 * That is the §2.1 split, and it is the one place the plan's own table is
 * wrong about the charts: `data` really does stay a property.
 *
 * A row is `{ label, [seriesKey]: number }`, exactly the shape the React
 * `BarChart` took, so `sessionDepthData` crosses untouched and
 * `series-key="depth"` names the column.
 */

export function AudiencePage() {
  const [dateRange, setDateRange] = useState('30d');

  const cell = (value: string) => <span style={{ fontSize: 'var(--font-size-sm)' }}>{value}</span>;

  return (
    <div className="demo-section" style={{ gap: 'var(--space-6)' }}>
      <PfPageHeader>
        Audience
        <span slot="description">Understand who your visitors are and how they engage.</span>
        <PfSelect
          slot="actions"
          value={dateRange}
          onPfChange={(event) => setDateRange(event.detail.value)}
        >
          {dateRangeOptions.map((option) => (
            <PfOption key={option.value} value={option.value}>
              {option.label}
            </PfOption>
          ))}
        </PfSelect>
      </PfPageHeader>

      <div className="demo-grid-2">
        <PfCard>
          <PfCardHeader>
            <PfSectionHeader>Session Depth</PfSectionHeader>
          </PfCardHeader>
          <PfCardContent>
            {/*
             * The React chart took a `valueFormatter` to abbreviate the axis
             * ticks by hand. The element has no such prop and needs none:
             * core's `formatAxisTick` is the one source of both the labels and
             * the geometry -- which is what stops gridlines saying 40 while
             * the bars peak at 30 -- and it already prints these as 2k, 4k,
             * 6k, 8k. Checked against the built app rather than assumed.
             */}
            <PfBarChart
              label="Sessions by page depth"
              data={sessionDepthData}
              yAxisLabel="Sessions"
              showLegend={false}
              style={{ width: '100%' }}
            >
              <PfChartSeries seriesKey="depth">Sessions</PfChartSeries>
            </PfBarChart>
          </PfCardContent>
        </PfCard>

        <PfCard>
          <PfCardHeader>
            <PfSectionHeader>Content Interest</PfSectionHeader>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', justifyContent: 'center' }}>
            {/*
             * One axis element per spoke. `pf-radar-axis` takes its name as a
             * `label` *string* where the React `RadarChart` took a `ReactNode`,
             * because the chart has to draw each name inside its own SVG and an
             * SVG `<text>` cannot hold arbitrary markup.
             */}
            <PfRadarChart label="Content interest by category" size={240}>
              {radarData.map((d) => (
                <PfRadarAxis key={d.label} label={d.label} value={d.thisMonth} />
              ))}
            </PfRadarChart>
          </PfCardContent>
        </PfCard>
      </div>

      <PfCard>
        <PfCardHeader>
          <PfSectionHeader>
            Goal Completion
            <span slot="description">Progress toward your conversion goals this period.</span>
          </PfSectionHeader>
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
        <PfSectionHeader divider style={{ marginBottom: 'var(--space-4)' }}>
          Top Pages
          <span slot="description">Most visited pages ranked by total views.</span>
        </PfSectionHeader>

        {/*
         * `striped` and the last row are the table's to work out, not the
         * consumer's: a row cannot count its siblings without assuming where
         * the header is, so `pf-table` writes `odd` and `last` down itself.
         */}
        <PfTable label="Top pages" striped hoverable style={{ width: '100%' }}>
          <PfTableRow head>
            {topPageColumns.map((column) => (
              <PfTableCell key={column.key} head align={column.align}>
                {column.header}
              </PfTableCell>
            ))}
          </PfTableRow>
          {topPages.map((p) => (
            <PfTableRow key={p.page}>
              <PfTableCell>
                <span
                  style={{
                    fontFamily: 'var(--pf-code-font-family)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {p.page}
                </span>
              </PfTableCell>
              <PfTableCell align="right">{cell(p.views.toLocaleString())}</PfTableCell>
              <PfTableCell align="right">{cell(p.unique.toLocaleString())}</PfTableCell>
              <PfTableCell align="right">
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: p.bounce > 50 ? 'var(--color-semantic-text-danger)' : 'inherit',
                  }}
                >
                  {p.bounce}%
                </span>
              </PfTableCell>
              <PfTableCell align="right">{cell(p.avgTime)}</PfTableCell>
            </PfTableRow>
          ))}
        </PfTable>
      </div>
    </div>
  );
}
