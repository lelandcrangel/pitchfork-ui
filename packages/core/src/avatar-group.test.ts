import { describe, expect, it } from 'vitest';
import { avatarGroupLabel, splitAvatarGroup } from './avatar-group';

describe('splitAvatarGroup', () => {
  it('shows every avatar when they fit', () => {
    expect(splitAvatarGroup(3, 5)).toEqual({ shown: 3, overflow: 0, total: 3 });
  });

  it('counts the ones it had to leave out', () => {
    expect(splitAvatarGroup(8, 5)).toEqual({ shown: 5, overflow: 3, total: 8 });
  });

  /* A group that knows its own size without an avatar for every member. */
  it('counts up to an explicit total', () => {
    expect(splitAvatarGroup(5, 5, 40)).toEqual({ shown: 5, overflow: 35, total: 40 });
    expect(splitAvatarGroup(2, 5, 40)).toEqual({ shown: 2, overflow: 38, total: 40 });
  });

  it('never reports a negative overflow', () => {
    expect(splitAvatarGroup(5, 5, 3)).toEqual({ shown: 5, overflow: 0, total: 3 });
  });

  it('floors a max that is not a count', () => {
    expect(splitAvatarGroup(4, -2)).toEqual({ shown: 0, overflow: 4, total: 4 });
    expect(splitAvatarGroup(4, 2.7)).toEqual({ shown: 2, overflow: 2, total: 4 });
    expect(splitAvatarGroup(4, Number.NaN)).toEqual({ shown: 0, overflow: 4, total: 4 });
  });

  it('has nothing to show for an empty group', () => {
    expect(splitAvatarGroup(0, 5)).toEqual({ shown: 0, overflow: 0, total: 0 });
  });
});

describe('avatarGroupLabel', () => {
  it('counts people, and one person', () => {
    expect(avatarGroupLabel(1)).toBe('1 person');
    expect(avatarGroupLabel(4)).toBe('4 people');
    expect(avatarGroupLabel(0)).toBe('0 people');
  });

  it('refuses to count nonsense', () => {
    expect(avatarGroupLabel(Number.NaN)).toBe('0 people');
    expect(avatarGroupLabel(-3)).toBe('0 people');
  });
});
