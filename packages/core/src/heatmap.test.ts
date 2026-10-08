import { describe, expect, it } from 'vitest';
import {
  buildHeatmapWeeks,
  heatmapCellColor,
  heatmapLevel,
  heatmapMonthLabels,
  heatmapRange,
  summariseHeatmap,
} from './heatmap';
import { formatISODate, parseISODate } from './date';

const day = (iso: string) => parseISODate(iso) as Date;

describe('heatmapRange', () => {
  it('takes the earliest and latest dates in the data', () => {
    const range = heatmapRange([
      { date: '2024-03-10', value: 1 },
      { date: '2024-03-01', value: 1 },
      { date: '2024-03-05', value: 1 },
    ]);

    expect(formatISODate(range!.start)).toBe('2024-03-01');
    expect(formatISODate(range!.end)).toBe('2024-03-10');
  });

  it('prefers explicit bounds', () => {
    const range = heatmapRange([{ date: '2024-03-10', value: 1 }], '2024-01-01', '2024-12-31');
    expect(formatISODate(range!.start)).toBe('2024-01-01');
    expect(formatISODate(range!.end)).toBe('2024-12-31');
  });

  it('is nothing to draw with no dates', () => {
    expect(heatmapRange([])).toBeNull();
  });

  /* An unparseable date would otherwise become an Invalid Date. */
  it('ignores a date that does not parse', () => {
    const range = heatmapRange([
      { date: 'last tuesday', value: 1 },
      { date: '2024-03-05', value: 1 },
    ]);
    expect(formatISODate(range!.start)).toBe('2024-03-05');
  });

  it('refuses a range the wrong way round', () => {
    expect(heatmapRange([], '2024-12-31', '2024-01-01')).toBeNull();
  });

  /* The 31st of February rolls forward in the Date constructor. */
  it('refuses a date that is not one', () => {
    expect(heatmapRange([{ date: '2024-02-31', value: 1 }])).toBeNull();
  });
});

describe('buildHeatmapWeeks', () => {
  it('builds columns of seven, aligned to the week start', () => {
    // 2024-03-06 is a Wednesday.
    const weeks = buildHeatmapWeeks(day('2024-03-06'), day('2024-03-20'), 0);

    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0].date.getDay()).toBe(0);
    expect(weeks[0][0].iso).toBe('2024-03-03');
  });

  it('aligns to Monday when asked', () => {
    const weeks = buildHeatmapWeeks(day('2024-03-06'), day('2024-03-20'), 1);
    expect(weeks[0][0].date.getDay()).toBe(1);
    expect(weeks[0][0].iso).toBe('2024-03-04');
  });

  it('marks the padding days as out of range', () => {
    const weeks = buildHeatmapWeeks(day('2024-03-06'), day('2024-03-08'), 0);
    const first = weeks[0];

    expect(first.map((cell) => cell.inRange)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      false,
    ]);
  });

  it('covers every day in the range exactly once', () => {
    const weeks = buildHeatmapWeeks(day('2024-03-01'), day('2024-03-31'), 0);
    const inRange = weeks.flat().filter((cell) => cell.inRange);

    expect(inRange).toHaveLength(31);
    expect(new Set(inRange.map((cell) => cell.iso)).size).toBe(31);
  });

  /*
   * A day step across a daylight-saving boundary loses or repeats a day when
   * the dates sit at midnight; `date.ts` pins everything to midday.
   */
  it('steps cleanly across a daylight-saving boundary', () => {
    const weeks = buildHeatmapWeeks(day('2024-03-01'), day('2024-04-30'), 0);
    const isos = weeks.flat().map((cell) => cell.iso);

    expect(new Set(isos).size).toBe(isos.length);
    // The US spring-forward Sunday, and the day on either side of it.
    expect(isos).toContain('2024-03-09');
    expect(isos).toContain('2024-03-10');
    expect(isos).toContain('2024-03-11');
    expect(isos).toContain('2024-03-31');
    expect(isos).toContain('2024-04-01');
  });

  it('is one column for a single day', () => {
    expect(buildHeatmapWeeks(day('2024-03-06'), day('2024-03-06'), 0)).toHaveLength(1);
  });

  /* Twenty years of columns is a frozen tab rather than a chart. */
  it('refuses to build more than 400 columns', () => {
    const weeks = buildHeatmapWeeks(day('1990-01-01'), day('2024-01-01'), 0);
    expect(weeks).toHaveLength(400);
  });
});

describe('summariseHeatmap', () => {
  it('reports the largest and the sum', () => {
    expect(
      summariseHeatmap([
        { date: 'a', value: 2 },
        { date: 'b', value: 5 },
      ]),
    ).toEqual({
      max: 5,
      total: 7,
    });
  });

  /*
   * One NaN used to carry through both reductions: every level came out NaN
   * and the accessible summary read "NaN total".
   */
  it('ignores a value that is not a number', () => {
    expect(
      summariseHeatmap([
        { date: 'a', value: Number.NaN },
        { date: 'b', value: 3 },
      ]),
    ).toEqual({ max: 3, total: 3 });
  });

  it('is zero for nothing', () => {
    expect(summariseHeatmap([])).toEqual({ max: 0, total: 0 });
  });
});

describe('heatmapLevel', () => {
  it('puts nothing at level 0', () => {
    expect(heatmapLevel(0, 10, 5)).toBe(0);
    expect(heatmapLevel(-1, 10, 5)).toBe(0);
  });

  /* A day with one commit must not look like a day with none. */
  it('puts the smallest positive value at level 1', () => {
    expect(heatmapLevel(1, 1000, 5)).toBe(1);
  });

  it('puts the largest value at the top level', () => {
    expect(heatmapLevel(10, 10, 5)).toBe(4);
  });

  it('spreads the middle between them', () => {
    expect(heatmapLevel(5, 10, 5)).toBe(2);
    expect(heatmapLevel(8, 10, 5)).toBe(4);
  });

  it('keeps at least two levels', () => {
    expect(heatmapLevel(5, 10, 1)).toBe(1);
    expect(heatmapLevel(5, 10, 0)).toBe(1);
  });

  it('is level 0 when nothing has a value', () => {
    expect(heatmapLevel(5, 0, 5)).toBe(0);
    expect(heatmapLevel(Number.NaN, 10, 5)).toBe(0);
  });
});

describe('heatmapCellColor', () => {
  it('is the empty colour at level 0', () => {
    expect(heatmapCellColor(0, 5)).toBe('var(--pf-heatmap-empty)');
  });

  it('mixes towards the full colour as the level rises', () => {
    expect(heatmapCellColor(1, 5)).toContain('25%');
    expect(heatmapCellColor(4, 5)).toContain('100%');
  });

  it('never mixes past the full colour', () => {
    expect(heatmapCellColor(99, 5)).toContain('100%');
  });

  it('never puts a non-number in the mix', () => {
    expect(heatmapCellColor(2, Number.NaN)).not.toMatch(/NaN/);
  });
});

describe('heatmapMonthLabels', () => {
  it('names each month at the column it first appears in', () => {
    const weeks = buildHeatmapWeeks(day('2024-02-26'), day('2024-04-07'), 1);
    const labels = heatmapMonthLabels(weeks);

    expect(labels.map((label) => label.label)).toEqual(['Feb', 'Mar', 'Apr']);
    expect(labels[0].column).toBe(1);
    expect(labels.every((label) => label.column >= 1)).toBe(true);
  });

  it('names a single month once', () => {
    const weeks = buildHeatmapWeeks(day('2024-03-04'), day('2024-03-24'), 1);
    expect(heatmapMonthLabels(weeks)).toHaveLength(1);
  });

  it('is empty for no weeks', () => {
    expect(heatmapMonthLabels([])).toEqual([]);
  });
});
