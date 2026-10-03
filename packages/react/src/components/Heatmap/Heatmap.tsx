import {
  HEATMAP_WEEKDAYS,
  buildHeatmapWeeks,
  formatISODate,
  heatmapCellColor,
  heatmapLevel,
  heatmapMonthLabels,
  heatmapRange,
  summariseHeatmap,
} from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Heatmap.css';

export interface HeatmapDatum {
  /** ISO date string, `YYYY-MM-DD` */
  date: string;
  value: number;
}

export interface HeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  data: HeatmapDatum[];
  /** First day to render (ISO). Defaults to the earliest date in `data`. */
  startDate?: string;
  /** Last day to render (ISO). Defaults to the latest date in `data`. */
  endDate?: string;
  /** Number of color buckets including the empty level. Defaults to 5. */
  levels?: number;
  /** 0 = Sunday, 1 = Monday. Defaults to 0. */
  weekStartsOn?: 0 | 1;
  /** Cell edge length in pixels. Defaults to 12. */
  cellSize?: number;
  /** Gap between cells in pixels. Defaults to 3. */
  cellGap?: number;
  showWeekdayLabels?: boolean;
  showMonthLabels?: boolean;
  /** Formats the native tooltip on each cell. */
  valueFormatter?: (value: number, date: string) => string;
  /** Accessible summary. Defaults to a generated description. */
  label?: string;
  emptyLabel?: React.ReactNode;
}

export const Heatmap = forwardRef<HTMLDivElement, HeatmapProps>(function Heatmap(
  {
    className,
    data,
    startDate,
    endDate,
    levels = 5,
    weekStartsOn = 0,
    cellSize = 12,
    cellGap = 3,
    showWeekdayLabels = true,
    showMonthLabels = true,
    valueFormatter,
    label,
    emptyLabel = 'No data',
    style,
    ...props
  },
  ref,
) {
  /*
   * All of the arithmetic is core's, so `<pf-heatmap>` draws the same grid —
   * and the date stepping goes through `date.ts`, which pins every date to
   * midday because a day step from midnight across a daylight-saving boundary
   * loses or repeats a day.
   */
  const range = heatmapRange(data, startDate, endDate);

  if (!range) {
    return (
      <div ref={ref} className={cx('pf-heatmap', className)} {...props}>
        <div className="pf-heatmap__empty">{emptyLabel}</div>
      </div>
    );
  }

  const { start, end } = range;
  const valueByDate = new Map(data.map((d) => [d.date, d.value]));
  /*
   * `Math.max(max, d.value)` and `sum + d.value` each carry one `NaN` through
   * everything: every cell's level came out `NaN` and the summary below read
   * "NaN total". Core skips the values that are not numbers.
   */
  const { max: maxValue, total } = summariseHeatmap(data);
  const levelCount = Math.max(2, levels);

  const weeks = buildHeatmapWeeks(start, end, weekStartsOn);
  const monthLabels = heatmapMonthLabels(weeks);

  const styleVars = {
    '--pf-heatmap-cell-size': `${cellSize}px`,
    '--pf-heatmap-cell-gap': `${cellGap}px`,
    ...style,
  } as React.CSSProperties;

  const ariaLabel =
    label ??
    `Activity heatmap from ${formatISODate(start)} to ${formatISODate(end)}, ${total} total`;

  return (
    <div
      ref={ref}
      className={cx('pf-heatmap', className)}
      style={styleVars}
      role="img"
      aria-label={ariaLabel}
      {...props}
    >
      <div className="pf-heatmap__body">
        {showWeekdayLabels ? (
          <div className="pf-heatmap__weekdays">
            {showMonthLabels ? (
              <span className="pf-heatmap__weekday-spacer" aria-hidden="true" />
            ) : null}
            <div className="pf-heatmap__weekday-grid">
              {Array.from({ length: 7 }, (_, i) => {
                const dow = (weekStartsOn + i) % 7;
                return (
                  <span key={i} className="pf-heatmap__weekday">
                    {i % 2 === 1 ? HEATMAP_WEEKDAYS[dow] : ''}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="pf-heatmap__main">
          {showMonthLabels ? (
            <div
              className="pf-heatmap__months"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, var(--pf-heatmap-cell-size))`,
              }}
              aria-hidden="true"
            >
              {monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.column}`}
                  className="pf-heatmap__month"
                  style={{ gridColumnStart: m.column }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="pf-heatmap__grid">
            {weeks.flatMap((week, wi) =>
              week.map((cell, di) => {
                if (!cell.inRange) {
                  return (
                    <span
                      key={`${wi}-${di}`}
                      className="pf-heatmap__cell pf-heatmap__cell--empty"
                    />
                  );
                }
                const value = valueByDate.get(cell.iso) ?? 0;
                const level = heatmapLevel(value, maxValue, levelCount);
                const title = valueFormatter
                  ? valueFormatter(value, cell.iso)
                  : `${cell.iso}: ${value}`;
                return (
                  <span
                    key={`${wi}-${di}`}
                    className="pf-heatmap__cell"
                    style={{
                      background: heatmapCellColor(level, levelCount),
                      animationDelay: `${wi * 8}ms`,
                    }}
                    title={title}
                    data-level={level}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Heatmap.displayName = 'Heatmap';
