import { describe, expect, it } from 'vitest';
import { isControlledValue, resolveNextValue } from './state';

describe('isControlledValue', () => {
  it('treats undefined as uncontrolled', () => {
    expect(isControlledValue(undefined)).toBe(false);
  });

  it('treats null as controlled — only undefined means "you keep track"', () => {
    expect(isControlledValue(null)).toBe(true);
  });

  it('treats falsy values as controlled', () => {
    expect(isControlledValue(false)).toBe(true);
    expect(isControlledValue(0)).toBe(true);
    expect(isControlledValue('')).toBe(true);
  });
});

describe('resolveNextValue', () => {
  it('returns a plain value unchanged', () => {
    expect(resolveNextValue('next', 'current')).toBe('next');
  });

  it('calls the updater with the current value', () => {
    expect(resolveNextValue((current: string | undefined) => `${current}!`, 'current')).toBe(
      'current!',
    );
  });

  it('passes undefined to the updater when there is no current value', () => {
    expect(resolveNextValue<boolean>((current) => current === undefined, undefined)).toBe(true);
  });
});
