import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BUNDLED_FA_ICON_NAMES, CUSTOM_GLYPHS } from './custom-glyphs';
import type { FontAwesomeIconDefinition, IconGlyph, LucideIconNode } from './glyph';
import { ICON_ROLES, getIconRoles, isIconRole } from './icon-roles';
import { getIconPaths, normalizeIconName, severityIconName } from './icons';

/*
 * These tests replace built-in glyphs and roles on purpose, so each one gets
 * a registry of its own: sharing one would let a test pass on whatever an
 * earlier test left registered. The state lives on `globalThis`, so a fresh
 * module alone is not a fresh registry — the key has to go as well.
 */
const REGISTRY_KEY = Symbol.for('@pitchfork-ui/core:icon-registry:v1');
let registry: typeof import('./icons');

beforeEach(async () => {
  delete (globalThis as Record<symbol, unknown>)[REGISTRY_KEY];
  vi.resetModules();
  registry = await import('./icons');
});

const fa = (
  name: string,
  aliases: string[] = [],
  path = 'M0 0h1v1H0z',
): FontAwesomeIconDefinition => ({
  prefix: 'far',
  iconName: name,
  icon: [512, 512, aliases, 'f000', path],
});

const faName = (glyph: IconGlyph | undefined) => glyph?.fontAwesome?.iconName;

const lucideX: LucideIconNode = [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
];

/*
 * A built app carries more than one copy of core — Stencil bundles it into
 * the elements' chunks — so a registration made through the app's copy has
 * to be visible through the elements'. Two module instances stand in for the
 * two copies.
 */
describe('one registry across copies of core', () => {
  it('resolves through one copy what was registered through another', async () => {
    vi.resetModules();
    const other: typeof import('./icons') = await import('./icons');
    expect(other).not.toBe(registry);

    registry.registerIconGlyphs({ 'from-the-app': fa('from-the-app') });

    expect(faName(other.resolveIconGlyph('from-the-app'))).toBe('from-the-app');
  });
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
    registry.registerIconGlyphs({ star: fa('star') });
  });

  it('resolves a registered name', () => {
    expect(faName(registry.resolveIconGlyph('star'))).toBe('star');
  });

  it('resolves a camelCase spelling of a registered name', () => {
    registry.registerIconGlyphs({ 'chart-bar': fa('chart-bar') });

    expect(faName(registry.resolveIconGlyph('chartBar'))).toBe('chart-bar');
  });

  it('returns undefined for a name nothing draws', () => {
    expect(registry.resolveIconGlyph('nothing-like-this')).toBeUndefined();
  });

  it('resolves a Font Awesome alias to the icon that replaced it', () => {
    registry.registerIconGlyphs({ 'chart-bar': fa('chart-bar', ['bar-chart']) });

    expect(faName(registry.resolveIconGlyph('bar-chart'))).toBe('chart-bar');
  });

  it('prefers a registered name over an alias of the same spelling', () => {
    registry.registerIconGlyphs({ 'chart-bar': fa('chart-bar', ['shadowed']) });
    registry.registerIconGlyphs({ shadowed: fa('shadowed') });

    expect(faName(registry.resolveIconGlyph('shadowed'))).toBe('shadowed');
  });

  it('takes the replaced icon aliases with it', () => {
    registry.registerIconGlyphs({ 'chart-bar': fa('chart-bar', ['bar-chart']) });
    registry.registerIconGlyphs({ 'chart-bar': fa('replacement', ['other-name']) });

    expect(registry.resolveIconGlyph('bar-chart')).toBeUndefined();
    expect(faName(registry.resolveIconGlyph('other-name'))).toBe('replacement');
  });

  it('accepts a Lucide node and a glyph as well as a Font Awesome definition', () => {
    const glyph: IconGlyph = { viewBox: '0 0 16 16', shapes: [{ kind: 'path', d: 'M1' }] };
    registry.registerIconGlyphs({ cross: lucideX, plain: glyph });

    expect(registry.resolveIconGlyph('cross')?.strokeWidth).toBe(2);
    expect(registry.resolveIconGlyph('plain')).toBe(glyph);
  });

  it('refuses something that is not an icon, naming it', () => {
    expect(() =>
      registry.registerIconGlyphs({ broken: { name: 'X' } as unknown as IconGlyph }),
    ).toThrow(/"broken"/);
  });

  it('lists registered names sorted, without aliases', () => {
    registry.registerIconGlyphs({ apple: fa('apple', ['pomme']) });
    const names = registry.getRegisteredIconNames();

    expect(names).toContain('apple');
    expect(names).not.toContain('pomme');
    expect([...names]).toEqual([...names].sort());
  });

  it('lists what draws with nothing further registered, built-in glyphs included', () => {
    const names = registry.getAvailableIconNames();

    expect(names).toContain('star');
    expect(names).toContain('chevron-down');
    expect(registry.getCustomIconNames()).toContain('triangle-exclamation');
  });
});

/*
 * Both layers used to look a name up among the built-in glyphs first, so the
 * thirteen of them could not be replaced at all: a consumer who registered
 * Font Awesome Pro got Pro everywhere except the chevrons, `plus`,
 * `magnifying-glass` and the rest of the icons the components draw most.
 */
describe('registered glyphs over the built-in ones', () => {
  it('draws a built-in glyph when nothing is registered under its name', () => {
    expect(registry.resolveIconGlyph('chevron-down')).toEqual(CUSTOM_GLYPHS['chevron-down']);
  });

  /*
   * `chevron-up` and `plus` rather than `chevron-down`: that one is also a
   * role, and a role looks its own name up in the registry before anything
   * else, so it passes with the built-in glyphs checked first. Measured.
   */
  it('draws the registered glyph instead once one is', () => {
    registry.registerIconGlyphs({ 'chevron-up': fa('pro-chevron-up'), plus: fa('pro-plus') });

    expect(faName(registry.resolveIconGlyph('chevron-up'))).toBe('pro-chevron-up');
    expect(faName(registry.resolveIconGlyph('chevronUp'))).toBe('pro-chevron-up');
    // And a role that defaults to the replaced glyph follows it.
    expect(faName(registry.resolveIconGlyph('add'))).toBe('pro-plus');
  });

  it('lets an alias of a registered icon win over a built-in glyph too', () => {
    registry.registerIconGlyphs({ 'circle-plus': fa('circle-plus', ['plus']) });

    expect(faName(registry.resolveIconGlyph('plus'))).toBe('circle-plus');
  });
});

describe('roles', () => {
  /*
   * A component asks for a role, so a role with nothing behind it is a
   * component drawing an empty box. `satisfies` in icon-roles.ts makes this a
   * compile error; this is the same claim at run time, for a default that
   * reached the table some other way.
   */
  it('defaults every role to a built-in glyph or a bundled Font Awesome icon', () => {
    const drawable = new Set<string>([...Object.keys(CUSTOM_GLYPHS), ...BUNDLED_FA_ICON_NAMES]);

    for (const role of getIconRoles()) {
      expect(drawable.has(ICON_ROLES[role]), `${role} → ${ICON_ROLES[role]}`).toBe(true);
    }
  });

  it('resolves a role whose default is built in, with nothing registered', () => {
    for (const role of getIconRoles()) {
      const fallback = ICON_ROLES[role];
      if (!(fallback in CUSTOM_GLYPHS)) continue;

      expect(registry.resolveIconGlyph(role), role).toEqual(
        CUSTOM_GLYPHS[fallback as keyof typeof CUSTOM_GLYPHS],
      );
    }
  });

  it('follows its default name, so registering that name changes the role', () => {
    registry.registerIconGlyphs({ 'circle-xmark': fa('circle-xmark') });

    expect(faName(registry.resolveIconGlyph('close'))).toBe('circle-xmark');
    expect(faName(registry.resolveIconGlyph('danger'))).toBe('circle-xmark');
  });

  it('changes only that role when registered under its own name', () => {
    registry.registerIconGlyphs({ 'circle-xmark': fa('circle-xmark'), close: lucideX });

    expect(registry.resolveIconGlyph('close')?.strokeWidth).toBe(2);
    expect(faName(registry.resolveIconGlyph('danger'))).toBe('circle-xmark');
    expect(faName(registry.resolveIconGlyph('circle-xmark'))).toBe('circle-xmark');
  });

  /*
   * Font Awesome's `xmark` lists `remove` among its former names and `plus`
   * lists `add`. If a role resolved through an alias, registering `faXmark`
   * for something else entirely would turn the number input's increment into
   * a cross.
   */
  it('is never captured by a Font Awesome alias', () => {
    registry.registerIconGlyphs({ xmark: fa('xmark', ['add', 'close', 'subtract']) });

    expect(registry.resolveIconGlyph('add')).toEqual(CUSTOM_GLYPHS.plus);
    expect(registry.resolveIconGlyph('subtract')).toEqual(CUSTOM_GLYPHS.minus);
    expect(faName(registry.resolveIconGlyph('close'))).toBeUndefined();
  });

  it('knows its own names', () => {
    expect(isIconRole('close')).toBe(true);
    expect(isIconRole('circle-xmark')).toBe(false);
    expect(isIconRole('toString')).toBe(false);
  });
});

describe('registerIconSet', () => {
  it('registers every entry, and lists the roles the set left on the defaults', () => {
    const left = registry.registerIconSet({
      close: lucideX,
      search: lucideX,
      'paper-plane': lucideX,
    });

    expect(registry.resolveIconGlyph('close')?.strokeWidth).toBe(2);
    expect(registry.resolveIconGlyph('paper-plane')).toBeDefined();
    expect(left).not.toContain('close');
    expect(left).not.toContain('search');
    expect(left).toContain('next');
  });

  it('counts a role as covered when the set names its default glyph instead', () => {
    const left = registry.registerIconSet({ 'magnifying-glass': fa('magnifying-glass') });

    expect(left).not.toContain('search');
    expect(faName(registry.resolveIconGlyph('search'))).toBe('magnifying-glass');
  });

  it('leaves nothing on the defaults when every role is named', () => {
    const set = Object.fromEntries(getIconRoles().map((role) => [role, lucideX]));

    expect(registry.registerIconSet(set)).toEqual([]);
  });

  it('converts each value first when given a converter', () => {
    const convert = vi.fn((d: string): IconGlyph => ({
      viewBox: '0 0 8 8',
      shapes: [{ kind: 'path', d }],
    }));
    registry.registerIconSet({ close: 'M1', next: 'M2' }, convert);

    expect(convert).toHaveBeenCalledWith('M1', 'close');
    expect(registry.resolveIconGlyph('next')?.shapes).toEqual([{ kind: 'path', d: 'M2' }]);
  });
});

describe('getIconPaths', () => {
  it('derives the viewBox from the definition dimensions', () => {
    expect(getIconPaths(fa('star')).viewBox).toBe('0 0 512 512');
  });

  it('returns a single path as a one-element list', () => {
    expect(getIconPaths(fa('star', [], 'M1')).paths).toEqual(['M1']);
  });

  it('returns both paths of a two-tone definition', () => {
    const duotone: FontAwesomeIconDefinition = { icon: [512, 512, [], 'f000', ['M1', 'M2']] };

    expect(getIconPaths(duotone).paths).toEqual(['M1', 'M2']);
  });
});

describe('severityIconName', () => {
  it('maps each severity to the role that stands for it', () => {
    expect(severityIconName('info')).toBe('info');
    expect(severityIconName('success')).toBe('success');
    expect(severityIconName('warning')).toBe('warning');
    expect(severityIconName('danger')).toBe('danger');
  });

  /*
   * Every name it returns has to be one the components can draw, or the
   * alert renders an empty box and warns.
   */
  it('returns roles, each with a default', () => {
    for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
      expect(isIconRole(severityIconName(variant)), variant).toBe(true);
    }
  });
});
