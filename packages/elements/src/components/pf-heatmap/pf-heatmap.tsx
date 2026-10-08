import {
  HEATMAP_WEEKDAYS,
  buildHeatmapWeeks,
  formatISODate,
  heatmapCellColor,
  heatmapLevel,
  heatmapMonthLabels,
  heatmapRange,
  summariseHeatmap,
  type HeatmapDatumLike,
} from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A calendar heatmap: one cell per day, darker where the value is higher.
 *
 * All of the arithmetic is core's, and the date stepping goes through
 * `date.ts`, which pins every date to midday — a day step from midnight
 * across a daylight-saving boundary loses or repeats a day, which is
 * invisible under UTC and is why both test projects now run in a timezone
 * that has daylight saving.
 *
 * @slot empty - what to show when there is nothing to draw.
 * @part empty - the empty state's box.
 * @part weekdays - the column of weekday names.
 * @part months - the row of month names.
 * @part grid - the cells.
 * @part cell - one day.
 */
@Component({
  tag: 'pf-heatmap',
  styleUrl: 'pf-heatmap.css',
  shadow: true,
})
export class PfHeatmap {
  /**
   * One entry per day with a value, as `{ date: 'YYYY-MM-DD', value }`.
   *
   * An array for a framework consumer, or JSON for plain HTML, because
   * Stencil coerces an attribute only for the primitive types it recognises
   * and would otherwise hand this the string verbatim.
   */
  @Prop() data: HeatmapDatumLike[] | string = [];

  /** First day to draw. Defaults to the earliest in the data. */
  @Prop() startDate?: string;

  /** Last day to draw. Defaults to the latest in the data. */
  @Prop() endDate?: string;

  /** Colour buckets, counting the empty one. */
  @Prop() levels = 5;

  /** 0 = Sunday, 1 = Monday. Read through a getter, which coerces. */
  @Prop() weekStartsOn: 0 | 1 = 0;

  @Prop() cellSize = 12;

  @Prop() cellGap = 3;

  @Prop({ reflect: true }) showWeekdayLabels = true;

  @Prop({ reflect: true }) showMonthLabels = true;

  /** The chart's accessible name. One is generated when it has none. */
  @Prop() label?: string;

  /** The entries, however they arrived. */
  private get entries(): HeatmapDatumLike[] {
    const raw = this.data;
    if (Array.isArray(raw)) return raw;

    try {
      const parsed = JSON.parse(String(raw || '[]'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // A malformed attribute is an empty heatmap, not a thrown render.
      return [];
    }
  }

  /**
   * `0 | 1`, coerced.
   *
   * Written out as `0 | 1` rather than as an imported alias, which is the
   * difference that decides whether Stencil coerces the attribute: measured
   * side by side, this arrives as the **number** `1` while
   * `pf-time-picker`'s imported `HourCycle` arrives as the string `"12"`.
   * The getter stays anyway — it costs nothing and covers a consumer who
   * sets the property to a string.
   */
  private get weekStart(): 0 | 1 {
    return Number(this.weekStartsOn) === 1 ? 1 : 0;
  }

  render() {
    const entries = this.entries;
    const range = heatmapRange(entries, this.startDate, this.endDate);
    const cellSize = Number(this.cellSize) || 12;
    const cellGap = Number(this.cellGap) || 3;

    if (!range) {
      return (
        <Host>
          <div class="empty" part="empty">
            <slot name="empty">No data</slot>
          </div>
        </Host>
      );
    }

    const { start, end } = range;
    /*
     * Passed through rather than clamped here: `heatmapLevel` and
     * `heatmapCellColor` both floor it at two buckets, and a second copy of
     * that clamp is a second thing to keep in step.
     */
    const levelCount = Number(this.levels);
    const byDate = new Map(entries.map((entry) => [entry.date, entry.value]));
    const { max, total } = summariseHeatmap(entries);
    const weeks = buildHeatmapWeeks(start, end, this.weekStart);
    const months = heatmapMonthLabels(weeks);

    return (
      <Host
        role="img"
        aria-label={
          this.label ??
          `Activity heatmap from ${formatISODate(start)} to ${formatISODate(end)}, ${total} total`
        }
        style={{
          '--pf-heatmap-cell-size': `${cellSize}px`,
          '--pf-heatmap-cell-gap': `${cellGap}px`,
        }}
      >
        <div class="body">
          {this.showWeekdayLabels && (
            <div class="weekdays" part="weekdays">
              {this.showMonthLabels && <span class="weekday-spacer" aria-hidden="true"></span>}
              <div class="weekday-grid">
                {Array.from({ length: 7 }, (_, index) => (
                  <span class="weekday">
                    {/* Every other name, or seven three-letter labels in a
                        12px column overlap each other. */}
                    {index % 2 === 1 ? HEATMAP_WEEKDAYS[(this.weekStart + index) % 7] : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div class="main">
            {this.showMonthLabels && (
              <div
                class="months"
                part="months"
                aria-hidden="true"
                style={{
                  gridTemplateColumns: `repeat(${weeks.length}, var(--pf-heatmap-cell-size))`,
                }}
              >
                {months.map((month) => (
                  <span class="month" style={{ gridColumnStart: String(month.column) }}>
                    {month.label}
                  </span>
                ))}
              </div>
            )}

            <div class="grid" part="grid">
              {weeks.flatMap((week, column) =>
                week.map((cell) =>
                  cell.inRange ? (
                    <span
                      class="cell"
                      part="cell"
                      title={`${cell.iso}: ${byDate.get(cell.iso) ?? 0}`}
                      data-level={String(heatmapLevel(byDate.get(cell.iso) ?? 0, max, levelCount))}
                      style={{
                        background: heatmapCellColor(
                          heatmapLevel(byDate.get(cell.iso) ?? 0, max, levelCount),
                          levelCount,
                        ),
                        // Staggered by column, so the grid wipes in oldest first.
                        animationDelay: `${column * 8}ms`,
                      }}
                    ></span>
                  ) : (
                    <span class="cell cell--empty"></span>
                  ),
                ),
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
