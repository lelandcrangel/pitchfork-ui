import { beforeEach, describe, expect, it } from 'vitest';
import {
  getIconPaths,
  getRegisteredIconNames,
  normalizeIconName,
  registerIconGlyphs,
  resolveIconGlyph,
  type IconGlyph,
} from './icons';

const glyph = (name: string, aliases: string[] = [], path = 'M0 0h1v1H0z'): IconGlyph => ({
  prefix: 'far',
  iconName: name,
  icon: [512, 512, aliases, 'f000', path],
});

describe('normalizeIconName', () => {
  it('kebab-cases a camelCase spelling', () => {
    expect(normalizeIconName('chartBar')).toBe('chart-bar');
  });

  it('leaves an already-kebab name alone', () => {
    expect(normalizeIconName('chart-bar')).toBe('chart-bar');
  });

  it('maps the spellings that kebab-casing gets wrong', () => {
    expect(normalizeIconName('circleCheck')).toBe('circle-check');
    expect(normalizeIconName('circleInfo')).toBe('circle-info');
  });
});

describe('the registry', () => {
  beforeEach(() => {
    registerIconGlyphs({ star: glyph('star') });
  });

  it('resolves a registered name', () => {
    expect(resolveIconGlyph('star')?.iconName).toBe('star');
  });

  it('resolves a camelCase spelling of a registered name', () => {
    registerIconGlyphs({ 'chart-bar': glyph('chart-bar') });

    expect(resolveIconGlyph('chartBar')?.iconName).toBe('chart-bar');
  });

  it('returns undefined for a name nobody registered', () => {
    expect(resolveIconGlyph('nothing-like-this')).toBeUndefined();
  });

  it('resolves a Font Awesome alias to the icon that replaced it', () => {
    registerIconGlyphs({ 'chart-bar': glyph('chart-bar', ['bar-chart']) });

    expect(resolveIconGlyph('bar-chart')?.iconName).toBe('chart-bar');
  });

  it('prefers a registered name over an alias of the same spelling', () => {
    registerIconGlyphs({ 'chart-bar': glyph('chart-bar', ['shadowed']) });
    registerIconGlyphs({ shadowed: glyph('shadowed') });

    expect(resolveIconGlyph('shadowed')?.iconName).toBe('shadowed');
  });

  it('takes the replaced icon aliases with it', () => {
    registerIconGlyphs({ 'chart-bar': glyph('chart-bar', ['bar-chart']) });
    registerIconGlyphs({ 'chart-bar': glyph('replacement', ['other-name']) });

    expect(resolveIconGlyph('bar-chart')).toBeUndefined();
    expect(resolveIconGlyph('other-name')?.iconName).toBe('replacement');
  });

  it('lists registered names sorted, without aliases', () => {
    registerIconGlyphs({ apple: glyph('apple', ['pomme']) });
    const names = getRegisteredIconNames();

    expect(names).toContain('apple');
    expect(names).not.toContain('pomme');
    expect([...names]).toEqual([...names].sort());
  });
});

describe('getIconPaths', () => {
  it('derives the viewBox from the glyph dimensions', () => {
    expect(getIconPaths(glyph('star')).viewBox).toBe('0 0 512 512');
  });

  it('returns a single path as a one-element list', () => {
    expect(getIconPaths(glyph('star', [], 'M1')).paths).toEqual(['M1']);
  });

  it('returns both paths of a two-tone glyph', () => {
    const duotone: IconGlyph = { icon: [512, 512, [], 'f000', ['M1', 'M2']] };

    expect(getIconPaths(duotone).paths).toEqual(['M1', 'M2']);
  });
});
