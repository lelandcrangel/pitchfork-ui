import { describe, expect, it } from 'vitest';
import { resolveSelectedTab } from './tabs';

const tabs = [{ value: 'overview' }, { value: 'details' }, { value: 'history', disabled: true }];

describe('resolveSelectedTab', () => {
  it('selects the tab carrying the value', () => {
    expect(resolveSelectedTab(tabs, 'details')?.value).toBe('details');
  });

  it('falls back to the first enabled tab when no value is asked for', () => {
    expect(resolveSelectedTab(tabs, undefined)?.value).toBe('overview');
    expect(resolveSelectedTab(tabs, '')?.value).toBe('overview');
  });

  it('falls back when no tab carries the value', () => {
    expect(resolveSelectedTab(tabs, 'nope')?.value).toBe('overview');
  });

  it('falls back when the value belongs to a disabled tab', () => {
    expect(resolveSelectedTab(tabs, 'history')?.value).toBe('overview');
  });

  it('skips a disabled first tab when falling back', () => {
    const leading = [{ value: 'a', disabled: true }, { value: 'b' }];
    expect(resolveSelectedTab(leading, 'nope')?.value).toBe('b');
  });

  it('has nothing to show when every tab is disabled, or there are none', () => {
    expect(resolveSelectedTab([{ value: 'a', disabled: true }], 'a')).toBeUndefined();
    expect(resolveSelectedTab([], 'a')).toBeUndefined();
  });

  it('keeps the caller’s own tab shape, so the result carries its payload', () => {
    const rich = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    expect(resolveSelectedTab(rich, 'b')?.label).toBe('B');
  });
});
