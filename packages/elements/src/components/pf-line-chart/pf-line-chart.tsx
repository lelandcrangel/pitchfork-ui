import {
  CHART_PADDING,
  CHART_PLOT,
  CHART_VIEW,
  areaSeriesPath,
  axisLabelStep,
  chartSeriesColor,
  formatAxisTick,
  niceAxisTicks,
  plotX,
  plotY,
  smoothSeriesPath,
  straightSeriesPath,
} from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State, Watch } from '@stencil/core';

/** One row of a chart's data: a label and a number per series. */
export type PfChartRow = { label: string } & Record<string, string | number>;

/**
 * A line or area chart over `pf-chart-series` children.
 *
 * The split follows what the data is: the rows are bulk numbers and live in a
 * property, while the series are the part with names and colours and live in
 * the light DOM, where a consumer can loop over them and where the legend can
 * reach their labels.
 *
 * Every scale and path is core's, so this and the React `LineChart` draw the
 * same chart — the axis labels and the geometry have to come from the same
 * tick scale, or the gridlines say one thing and the line says another.
 *
 * @slot - the `pf-chart-series` children.
 * @slot empty - what to show when there is nothing to draw.
 * @part svg - the drawing.
 * @part grid - one gridline.
 * @part tick - one axis label.
 * @part line - one series' line.
 * @part area - one series' fill, on the area variant.
 * @part dot - one data point.
 * @part legend - the list the series are slotted into.
 * @part empty - the empty state's box.
 */
@Component({
  tag: 'pf-line-chart',
  styleUrl: 'pf-line-chart.css',
  shadow: true,
})
export class PfLineChart {
  @Element() el!: HTMLElement;

  /**
   * The rows to plot.
   *
   * An array for a framework consumer, or JSON for plain HTML, because
   * Stencil coerces an attribute only for the primitive types it recognises.
   */
  @Prop() data: PfChartRow[] | string = [];

  /** Fill under each line. Reflected. */
  @Prop({ reflect: true }) area = false;

  /** Curve the lines through their points rather than joining them straight. */
  @Prop({ reflect: true }) curved = true;

  @Prop({ reflect: true }) showLegend = true;

  /** Printed down the y axis, and used as the chart's name when it has none. */
  @Prop() yAxisLabel?: string;

  /** The chart's accessible name. */
  @Prop() label?: string;

  /** The series, read from the light DOM. */
  @State() series: { key: string; color: string; dashed: boolean }[] = [];

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /** Re-reads the series, for a consumer who changed one through a property. */
  @Method()
  async refresh() {
    this.sync();
  }

  /**
   * Direct children only: a nested chart owns its own series.
   *
   * Named `seriesElements`, not `children`: a component class's members land
   * on the custom element itself, so a getter called `children` shadows
   * `Element.children` and anything that walks it recurses for ever.
   */
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
      // A malformed attribute is an empty chart, not a thrown render.
      return [];
    }
  }

  @Watch('data')
  sync() {
    const elements = this.seriesElements;

    this.series = elements.map((element, index) => {
      const node = element as HTMLElement & {
        seriesKey?: string;
        color?: string;
        dashed?: boolean;
      };
      const color = chartSeriesColor(
        index,
        node.color ?? element.getAttribute('color') ?? undefined,
      );

      (element as HTMLElement & { swatch: string }).swatch = color;

      return {
        key: node.seriesKey ?? element.getAttribute('series-key') ?? '',
        color,
        dashed: node.dashed ?? element.hasAttribute('dashed'),
      };
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
          {/* The list stays in the tree, or `slotchange` never fires again. */}
          <ul class="legend legend--hidden" part="legend">
            <slot onSlotchange={() => this.refresh()} />
          </ul>
        </Host>
      );
    }

    const valueAt = (row: PfChartRow, key: string) => Number(row[key] ?? 0);
    const highest = Math.max(
      0,
      ...series.flatMap((item) => rows.map((row) => valueAt(row, item.key))),
    );
    const ticks = niceAxisTicks(highest);
    const maxTick = ticks[ticks.length - 1];
    const labelStep = axisLabelStep(rows.length);
    const floor = CHART_PADDING.top + CHART_PLOT.height;

    return (
      <Host
        style={{
          // Lets the legend's start edge line up with the plot area.
          '--pf-chart-plot-inset-left': `${(CHART_PADDING.left / CHART_VIEW.width) * 100}%`,
        }}
      >
        <svg
          class="svg"
          part="svg"
          viewBox={`0 0 ${CHART_VIEW.width} ${CHART_VIEW.height}`}
          role="img"
          aria-label={this.label ?? this.yAxisLabel ?? 'Line chart'}
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
              <text class="tick tick--x" part="tick" x={plotX(index, rows.length)} y={floor + 20}>
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

          {series.map((item) => {
            const points = rows.map((row, index) => ({
              x: plotX(index, rows.length),
              y: plotY(valueAt(row, item.key), maxTick),
            }));
            const line = this.curved ? smoothSeriesPath(points) : straightSeriesPath(points);

            return (
              <g>
                {this.area && (
                  <path
                    class="area"
                    part="area"
                    d={areaSeriesPath(line, points)}
                    fill={item.color}
                    fill-opacity="0.12"
                    stroke="none"
                  />
                )}
                <path
                  class="line"
                  part="line"
                  d={line}
                  fill="none"
                  stroke={item.color}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-dasharray={item.dashed ? '6 4' : undefined}
                />
                {points.map((point, index) => (
                  <circle
                    class="dot"
                    part="dot"
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill={item.color}
                  >
                    <title>{`${rows[index].label}: ${formatAxisTick(
                      valueAt(rows[index], item.key),
                    )}`}</title>
                  </circle>
                ))}
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
