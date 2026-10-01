import { describe, expect, it } from 'vitest';
import { formatKeyCombination, getAvatarInitials } from './text';

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
