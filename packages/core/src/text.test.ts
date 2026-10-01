import { describe, expect, it } from 'vitest';
import { formatCardNumber, formatKeyCombination, getAvatarInitials, maskCardNumber } from './text';

describe('getAvatarInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getAvatarInitials('Ada Lovelace')).toBe('AL');
  });

  it('uses one letter for a single word', () => {
    expect(getAvatarInitials('Ada')).toBe('A');
  });

  it('ignores words beyond the second', () => {
    expect(getAvatarInitials('Ada Byron King Lovelace')).toBe('AB');
  });

  it('uppercases whatever it finds', () => {
    expect(getAvatarInitials('ada lovelace')).toBe('AL');
  });

  it('collapses runs of whitespace', () => {
    expect(getAvatarInitials('  Ada   Lovelace  ')).toBe('AL');
  });

  it('falls back to ? for an absent name', () => {
    expect(getAvatarInitials()).toBe('?');
    expect(getAvatarInitials(undefined)).toBe('?');
  });

  it('falls back to ? for an empty or whitespace-only name', () => {
    expect(getAvatarInitials('')).toBe('?');
    expect(getAvatarInitials('   ')).toBe('?');
  });

  it('keeps a non-letter first character as-is', () => {
    expect(getAvatarInitials('42 Agency')).toBe('4A');
  });
});

describe('formatKeyCombination', () => {
  it('joins keys with a spaced separator', () => {
    expect(formatKeyCombination(['⌘', 'K'])).toBe('⌘ + K');
  });

  it('honours a custom separator', () => {
    expect(formatKeyCombination(['Ctrl', 'Shift', 'P'], 'then')).toBe('Ctrl then Shift then P');
  });

  it('returns a single key unchanged', () => {
    expect(formatKeyCombination(['Esc'])).toBe('Esc');
  });

  it('returns an empty string for no keys', () => {
    expect(formatKeyCombination([])).toBe('');
  });
});

describe('formatCardNumber', () => {
  it('groups digits into blocks of four', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('regroups a value that already carries separators', () => {
    expect(formatCardNumber('4111-1111 1111.1111')).toBe('4111 1111 1111 1111');
  });

  it('leaves a trailing partial block ungrouped and untrimmed of digits', () => {
    expect(formatCardNumber('411111111')).toBe('4111 1111 1');
  });

  it('returns an empty string when there are no digits at all', () => {
    expect(formatCardNumber('no digits here')).toBe('');
  });
});

describe('maskCardNumber', () => {
  it('stars everything but the last four, then groups', () => {
    expect(maskCardNumber('4111111111111111')).toBe('**** **** **** 1111');
  });

  /*
   * Starring four digits or fewer would leave a field whose only content is its
   * own length, so the digits are returned bare.
   */
  it('returns four digits or fewer unmasked', () => {
    expect(maskCardNumber('1111')).toBe('1111');
    expect(maskCardNumber('11')).toBe('11');
    expect(maskCardNumber('')).toBe('');
  });

  /*
   * A 15-digit Amex number masks to 11 stars plus 4 digits, and grouping that
   * in fours cuts across the boundary: the third group ends with the first
   * visible digit. Asserted rather than fixed, because the React component
   * does exactly this and the two layers have to agree -- changing it is a
   * design decision for both at once, not a port detail.
   */
  it('groups in fours even when that splits the visible digits (15-digit Amex)', () => {
    expect(maskCardNumber('378282246310005')).toBe('**** **** ***0 005');
  });

  it('keeps exactly the last four digits visible, whatever the grouping', () => {
    const masked = maskCardNumber('378282246310005').replace(/\s+/g, '');

    expect(masked).toHaveLength(15);
    expect(masked.slice(-4)).toBe('0005');
    expect(masked.slice(0, -4)).toBe('*'.repeat(11));
  });

  it('ignores separators in the input when counting', () => {
    expect(maskCardNumber('4111-1111-1111-1111')).toBe('**** **** **** 1111');
  });
});
