import { describe, expect, it } from 'vitest';
import { resolveCurrentCrumb } from './breadcrumbs';

describe('resolveCurrentCrumb', () => {
  it('takes the last crumb when none is marked', () => {
    expect(resolveCurrentCrumb([{}, {}, {}])).toBe(2);
  });

  it('takes the crumb that says so', () => {
    expect(resolveCurrentCrumb([{}, { current: true }, {}])).toBe(1);
  });

  /* One index, so a marked crumb and the last one cannot both be current. */
  it('does not also take the last crumb', () => {
    expect(resolveCurrentCrumb([{ current: true }, {}])).toBe(0);
  });

  it('takes the first of several marked', () => {
    expect(resolveCurrentCrumb([{}, { current: true }, { current: true }])).toBe(1);
  });

  it('ignores a crumb marked false', () => {
    expect(resolveCurrentCrumb([{ current: false }, {}])).toBe(1);
  });

  it('has nothing to point at in an empty trail', () => {
    expect(resolveCurrentCrumb([])).toBe(-1);
  });

  it('points at the only crumb in a trail of one', () => {
    expect(resolveCurrentCrumb([{}])).toBe(0);
  });
});
