import {
  CHART_PADDING,
  CHART_PLOT,
  CHART_VIEW,
  axisLabelStep,
  barGeometry,
  chartSeriesColor,
  formatAxisTick,
  niceAxisTicks,
  plotY,
} from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State, Watch } from '@stencil/core';
import type { PfChartRow } from '../pf-line-chart/pf-line-chart';

/**
 * A grouped or stacked bar chart over `pf-chart-series` children.
 *
 * The same split as `pf-line-chart`: the rows are bulk numbers in a property,
 * the series are named and coloured and live in the light DOM so the legend
 * can reach their labels.
 *
 * @slot - the `pf-chart-series` children.
 * @slot empty - what to show when there is nothing to draw.
 * @part svg - the drawing.
 * @part grid - one gridline.
 * @part tick - one axis label.
 * @part bar - one bar.
 * @part legend - the list the series are slotted into.
 * @part empty - the empty state's box.
 */
@Component({
  tag: 'pf-bar-chart',
  styleUrl: 'pf-bar-chart.css',
  shadow: true,
})
export class PfBarChart {
  @Element() el!: HTMLElement;

  /** The rows to plot. An array, or JSON for plain HTML. */
  @Prop() data: PfChartRow[] | string = [];

  /** Stack each group's series rather than standing them side by side. */
  @Prop({ reflect: true }) stacked = false;

  @Prop({ reflect: true }) showLegend = true;

  @Prop() yAxisLabel?: string;

  @Prop() label?: string;

  @State() series: { key: string; color: string }[] = [];

  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only; named to avoid shadowing `Element.children`. */
  private get seriesElements(): HTMLElement[] {
    return Array.from(this.el.children).filter(
      (child) => child.tagName.toLowerCase() === 'pf-chart-series',
    ) as HTMLElement[];
  }

  private get rows(): PfChartRow[] {
    const raw = this.data;
    if (Array.isArray(raw)) return raw;

    try {
      const parsed = JSON.parse(String(raw || '[]'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  @Watch('data')
  sync() {
    this.series = this.seriesElements.map((element, index) => {
      const node = element as HTMLElement & { seriesKey?: string; color?: string };
      const color = chartSeriesColor(
        index,
        node.color ?? element.getAttribute('color') ?? undefined,
      );

      (element as HTMLElement & { swatch: string }).swatch = color;

      return { key: node.seriesKey ?? element.getAttribute('series-key') ?? '', color };
    });
  }

  render() {
    const rows = this.rows;
    const series = this.series;

    if (rows.length === 0 || series.length === 0) {
      return (
        <Host>
          <div class="empty" part="empty">
            <slot name="empty">No data</slot>
          </div>
          <ul class="legend legend--hidden" part="legend">
            <slot onSlotchange={() => this.refresh()} />
          </ul>
        </Host>
      );
    }

    /*
     * Clamped here and nowhere else. A negative value must not pull a stack
     * down, and it must not give a `<rect>` a negative `height` — which is
     * an error the browser drops the element for. One clamp rather than two,
     * so there is one thing to keep right.
     */
    const valueAt = (row: PfChartRow, key: string) => Math.max(0, Number(row[key] ?? 0) || 0);
    /*
     * A stacked chart's scale is the tallest *stack*, not the tallest bar —
     * otherwise the top of the stack is drawn above the plot.
     */
    const totals = this.stacked
      ? rows.map((row) => series.reduce((sum, item) => sum + valueAt(row, item.key), 0))
      : series.flatMap((item) => rows.map((row) => valueAt(row, item.key)));

    const ticks = niceAxisTicks(Math.max(0, ...totals));
    const maxTick = ticks[ticks.length - 1];
    const geometry = barGeometry(rows.length, series.length, this.stacked);
    const labelStep = axisLabelStep(rows.length);
    const floor = CHART_PADDING.top + CHART_PLOT.height;

    return (
      <Host
        style={{
          '--pf-chart-plot-inset-left': `${(CHART_PADDING.left / CHART_VIEW.width) * 100}%`,
        }}
      >
        <svg
          class="svg"
          part="svg"
          viewBox={`0 0 ${CHART_VIEW.width} ${CHART_VIEW.height}`}
          role="img"
          aria-label={this.label ?? this.yAxisLabel ?? 'Bar chart'}
        >
          {ticks.map((tick) => {
            const y = plotY(tick, maxTick);
            return (
              <g>
                <line
                  class="grid"
                  part="grid"
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_PADDING.left + CHART_PLOT.width}
                  y2={y}
                />
                <text class="tick tick--y" part="tick" x={CHART_PADDING.left - 8} y={y}>
                  {formatAxisTick(tick)}
                </text>
              </g>
            );
          })}

          {rows.map((row, index) =>
            index % labelStep === 0 ? (
              <text
                class="tick tick--x"
                part="tick"
                x={geometry.groupCenters[index]}
                y={floor + 20}
              >
                {row.label}
              </text>
            ) : null,
          )}

          {this.yAxisLabel && (
            <text
              class="axis-label"
              x={-(CHART_PADDING.top + CHART_PLOT.height / 2)}
              y={14}
              transform="rotate(-90)"
            >
              {this.yAxisLabel}
            </text>
          )}

          {rows.map((row, groupIndex) => {
            let base = 0;

            return (
              <g>
                {series.map((item, seriesIndex) => {
                  const value = valueAt(row, item.key);
                  const height = (value / (maxTick > 0 ? maxTick : 1)) * CHART_PLOT.height;
                  const x = this.stacked
                    ? geometry.groupLefts[groupIndex]
                    : geometry.groupLefts[groupIndex] +
                      seriesIndex * (geometry.barWidth + geometry.gap);
                  const y = this.stacked ? plotY(base + value, maxTick) : floor - height;

                  if (this.stacked) base += value;

                  return (
                    <rect
                      class="bar"
                      part="bar"
                      x={x}
                      y={y}
                      width={geometry.barWidth}
                      height={height}
                      rx="2"
                      fill={item.color}
                    >
                      <title>{`${row.label} — ${item.key}: ${formatAxisTick(value)}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </svg>

        <ul
          class={{ legend: true, 'legend--hidden': !this.showLegend || series.length < 2 }}
          part="legend"
        >
          <slot onSlotchange={() => this.refresh()} />
        </ul>
      </Host>
    );
  }
}
