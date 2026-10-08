import { describe, expect, it } from 'vitest';
import {
  clampNumber,
  decimalsOf,
  formatNumberValue,
  parseNumberValue,
  roundToStep,
  stepNumber,
} from './number-field';

describe('decimalsOf', () => {
  it('counts the places a step has', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.25)).toBe(2);
  });

  /* `String(1e-7)` keeps the exponent, so there is no point to count. */
  it('reports none for a step written as an exponent', () => {
    expect(decimalsOf(1e-7)).toBe(0);
  });
});

describe('clampNumber', () => {
  it('keeps a value inside the range', () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-1, 0, 10)).toBe(0);
    expect(clampNumber(11, 0, 10)).toBe(10);
  });

  it('leaves an unbounded value alone', () => {
    expect(clampNumber(12345, -Infinity, Infinity)).toBe(12345);
  });
});

describe('roundToStep', () => {
  /* The whole reason this exists: 0.1 + 0.2 is not 0.3 in binary. */
  it('rounds to the step’s own precision', () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(2.5, 1)).toBe(3);
    expect(roundToStep(1.2345, 0.01)).toBe(1.23);
  });
});

describe('stepNumber', () => {
  it('steps up and down', () => {
    expect(stepNumber(5, 1, { step: 1 })).toBe(6);
    expect(stepNumber(5, -1, { step: 1 })).toBe(4);
  });

  it('does not drift over ten steps of a tenth', () => {
    let value: number | null = 0;
    for (let i = 0; i < 10; i += 1) value = stepNumber(value, 1, { step: 0.1 });
    expect(value).toBe(1);
  });

  it('clamps at both ends', () => {
    expect(stepNumber(10, 1, { min: 0, max: 10 })).toBe(10);
    expect(stepNumber(0, -1, { min: 0, max: 10 })).toBe(0);
  });

  /* An empty field has to start somewhere, and the bound is the useful place. */
  it('starts from the nearer bound when the field is empty', () => {
    expect(stepNumber(null, 1, { min: 10, max: 20 })).toBe(11);
    expect(stepNumber(null, -1, { min: 10, max: 20 })).toBe(10);
    expect(stepNumber(null, -1, { max: 20 })).toBe(19);
    expect(stepNumber(null, 1, {})).toBe(1);
  });
});

describe('parseNumberValue', () => {
  it('reads a number', () => {
    expect(parseNumberValue('42')).toBe(42);
    expect(parseNumberValue(' 3.5 ')).toBe(3.5);
    expect(parseNumberValue('-2')).toBe(-2);
  });

  /* A cleared field is not a field holding zero. */
  it('reads an empty field as nothing', () => {
    expect(parseNumberValue('')).toBeNull();
    expect(parseNumberValue('   ')).toBeNull();
  });

  it('reads nonsense as nothing', () => {
    expect(parseNumberValue('twelve')).toBeNull();
    expect(parseNumberValue('1.2.3')).toBeNull();
  });
});

describe('formatNumberValue', () => {
  it('writes the plain number when no format is asked for', () => {
    expect(formatNumberValue(1234.5)).toBe('1234.5');
  });

  it('writes nothing for an empty field', () => {
    expect(formatNumberValue(null)).toBe('');
    expect(formatNumberValue(Number.NaN)).toBe('');
  });

  it('uses the format it is given', () => {
    expect(
      formatNumberValue(1234.5, {
        locale: 'en-GB',
        format: { style: 'currency', currency: 'GBP' },
      }),
    ).toBe('£1,234.50');
  });
});
