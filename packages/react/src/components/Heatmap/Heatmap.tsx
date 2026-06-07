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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

interface Cell {
  iso: string;
  date: Date;
  inRange: boolean;
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
  const sortedDates = data.map((d) => d.date).sort();
  const hasRange = Boolean(startDate || endDate || data.length);

  if (!hasRange) {
    return (
      <div ref={ref} className={cx('pf-heatmap', className)} {...props}>
        <div className="pf-heatmap__empty">{emptyLabel}</div>
      </div>
    );
  }

  const valueByDate = new Map(data.map((d) => [d.date, d.value]));
  const maxValue = data.reduce((max, d) => Math.max(max, d.value), 0);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const levelCount = Math.max(2, levels);

  const start = parseISO(startDate ?? sortedDates[0]);
  const end = parseISO(endDate ?? sortedDates[sortedDates.length - 1]);

  // Align the grid start back to the configured week start.
  const startOffset = (start.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays(start, -startOffset);

  const weeks: Cell[][] = [];
  let cursor = gridStart;
  while (cursor <= end) {
    const week: Cell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        iso: toISO(cursor),
        date: new Date(cursor),
        inRange: cursor >= start && cursor <= end,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  function levelFor(value: number): number {
    if (value <= 0 || maxValue <= 0) return 0;
    return Math.min(levelCount - 1, Math.max(1, Math.ceil((value / maxValue) * (levelCount - 1))));
  }

  function cellColor(level: number): string {
    if (level === 0) return 'var(--pf-heatmap-empty)';
    const pct = Math.round((level / (levelCount - 1)) * 100);
    return `color-mix(in srgb, var(--pf-heatmap-color) ${pct}%, var(--pf-heatmap-empty))`;
  }

  // Month labels positioned at the column where each new month first appears.
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const firstInRange = week.find((c) => c.inRange);
    if (!firstInRange) return;
    const month = firstInRange.date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ col: col + 1, label: MONTHS[month] });
      lastMonth = month;
    }
  });

  const styleVars = {
    '--pf-heatmap-cell-size': `${cellSize}px`,
    '--pf-heatmap-cell-gap': `${cellGap}px`,
    ...style,
  } as React.CSSProperties;

  const ariaLabel =
    label ?? `Activity heatmap from ${toISO(start)} to ${toISO(end)}, ${total} total`;

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
                    {i % 2 === 1 ? WEEKDAYS[dow] : ''}
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
                  key={`${m.label}-${m.col}`}
                  className="pf-heatmap__month"
                  style={{ gridColumnStart: m.col }}
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
                const level = levelFor(value);
                const title = valueFormatter
                  ? valueFormatter(value, cell.iso)
                  : `${cell.iso}: ${value}`;
                return (
                  <span
                    key={`${wi}-${di}`}
                    className="pf-heatmap__cell"
                    style={{ background: cellColor(level), animationDelay: `${wi * 8}ms` }}
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
