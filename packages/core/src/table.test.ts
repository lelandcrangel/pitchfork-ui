import { describe, expect, it } from 'vitest';
import {
  ariaSortFor,
  compareSortValues,
  nextSortState,
  normalizeSortValue,
  sortRowsBy,
} from './table';

describe('normalizeSortValue', () => {
  it('keeps a number, and takes a date’s time', () => {
    expect(normalizeSortValue(42)).toBe(42);
    expect(normalizeSortValue(new Date('2024-03-15T00:00:00Z'))).toBe(
      new Date('2024-03-15T00:00:00Z').getTime(),
    );
  });

  it('turns everything else into text, and nothing into none', () => {
    expect(normalizeSortValue('Ada')).toBe('Ada');
    expect(normalizeSortValue(null)).toBe('');
    expect(normalizeSortValue(undefined)).toBe('');
  });
});

describe('compareSortValues', () => {
  it('compares numbers numerically', () => {
    expect(compareSortValues(2, 10)).toBeLessThan(0);
    expect(compareSortValues(2, 10, 'desc')).toBeGreaterThan(0);
  });

  /* The collation this exists for: "Item 2" before "Item 10". */
  it('compares text with numbers in it the way a reader expects', () => {
    expect(compareSortValues('Item 2', 'Item 10')).toBeLessThan(0);
    expect(compareSortValues('Item 10', 'Item 2')).toBeGreaterThan(0);
  });

  it('ignores case and accents', () => {
    expect(compareSortValues('ada', 'Ada')).toBe(0);
    expect(compareSortValues('resume', 'résumé')).toBe(0);
  });

  it('sorts a missing value to one end', () => {
    expect(compareSortValues(null, 'Ada')).toBeLessThan(0);
    expect(compareSortValues(null, 'Ada', 'desc')).toBeGreaterThan(0);
  });
});

describe('nextSortState', () => {
  it('starts a new column ascending', () => {
    expect(nextSortState(undefined, 'name')).toEqual({ key: 'name', direction: 'asc' });
    expect(nextSortState({ key: 'total', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });

  it('turns the current column round', () => {
    expect(nextSortState({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
    expect(nextSortState({ key: 'name', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });
});

describe('ariaSortFor', () => {
  it('reports the sorted column’s direction, and none for the others', () => {
    const state = { key: 'name', direction: 'asc' } as const;
    expect(ariaSortFor(state, 'name')).toBe('ascending');
    expect(ariaSortFor({ key: 'name', direction: 'desc' }, 'name')).toBe('descending');
    expect(ariaSortFor(state, 'total')).toBe('none');
    expect(ariaSortFor(undefined, 'name')).toBe('none');
  });
});

describe('sortRowsBy', () => {
  const rows = [{ name: 'Item 10' }, { name: 'Item 2' }, { name: 'Item 1' }];

  it('sorts without disturbing the rows it was given', () => {
    const sorted = sortRowsBy(rows, (row) => row.name, 'asc');
    expect(sorted.map((row) => row.name)).toEqual(['Item 1', 'Item 2', 'Item 10']);
    expect(rows.map((row) => row.name)).toEqual(['Item 10', 'Item 2', 'Item 1']);
  });

  it('sorts the other way round', () => {
    expect(sortRowsBy(rows, (row) => row.name, 'desc').map((row) => row.name)).toEqual([
      'Item 10',
      'Item 2',
      'Item 1',
    ]);
  });
});
