/**
 * The shared icon registry.
 *
 * Both rendering layers resolve names through this one module, so a consumer
 * who calls `registerIconGlyphs()` gets the icon in React components *and* in
 * custom elements. A registry per layer would silently give them one or the
 * other.
 *
 * It holds `IconGlyph`, the general shape in `./glyph`, and converts a Font
 * Awesome definition or a Lucide node on the way in — so `<pf-icon>` and the
 * React `Icon` each have one thing to draw, whichever set it came from.
 *
 * Resolution, in order, for a name after it is kebab-cased:
 *
 * 1. anything registered under that name;
 * 2. if it is a role (`./icon-roles`), whatever the role's default resolves to;
 * 3. a Font Awesome alias of something registered;
 * 4. one of the built-in glyphs in `./custom-glyphs`.
 *
 * The built-in glyphs come last. They used to be checked first, in both
 * layers, which made the thirteen of them — the chevrons, `circle-info`,
 * `plus`, `magnifying-glass` and the rest — impossible to replace: a consumer
 * registering Font Awesome Pro got Pro everywhere except the icons the
 * components draw most.
 */

import { getCustomGlyphNames, resolveCustomGlyph } from './custom-glyphs';
import {
  type FontAwesomeIconDefinition,
  type IconGlyph,
  type IconGlyphInput,
  toIconGlyph,
} from './glyph';
import { ICON_ROLES, type IconRole, getIconRoles, isIconRole } from './icon-roles';

/**
 * The registry's state, shared by every copy of this module on the page.
 *
 * There is more than one copy in an ordinary build, which is what this
 * fixes. Stencil bundles `@pitchfork-ui/core` into the elements' own chunks,
 * so a built app has the elements' copy and its own: measured in
 * `apps/consumer-react`'s production bundle, which carried core's registry
 * twice. A module-level `Map` was therefore one registry per copy, and a
 * consumer's `registerIconGlyphs()` reached their own imports and never
 * `<pf-icon>` — the one thing the shared registry exists to do. No unit test
 * could see it, because a test imports one copy; the consumer smoke, which
 * registers a glyph from the app and looks for it in the element, is what
 * caught it.
 *
 * `Symbol.for` is the one key every copy can agree on, including two
 * versions of core installed side by side. The `v1` is for the day this
 * shape changes, so an older copy never reads a newer one's maps.
 */
interface RegistryState {
  /** Every registered glyph, bundled or added by a consumer at runtime. */
  readonly registered: Map<string, IconGlyph>;
  /**
   * Font Awesome records an icon's former names, so `bar-chart` keeps
   * resolving after the icon was renamed to `chart-bar`. Aliases lose to
   * registered names, so registering under an alias is never shadowed.
   */
  readonly aliases: Map<string, IconGlyph>;
}

const REGISTRY_KEY = Symbol.for('@pitchfork-ui/core:icon-registry:v1');
const scope = globalThis as unknown as Record<symbol, RegistryState | undefined>;
const state: RegistryState = (scope[REGISTRY_KEY] ??= {
  registered: new Map(),
  aliases: new Map(),
});
const { registered, aliases } = state;

const registerAliases = (glyph: IconGlyph) => {
  for (const alias of glyph.aliases ?? []) {
    if (typeof alias === 'string') aliases.set(alias, glyph);
  }
};

/**
 * Drop the aliases a glyph brought with it. Without this, replacing a
 * registered icon leaves its old aliases pointing at the old glyph.
 */
const unregisterAliases = (glyph: IconGlyph) => {
  for (const [alias, target] of aliases) {
    if (target === glyph) aliases.delete(alias);
  }
};

/** Spellings that do not survive kebab-casing. */
const legacySpellings: Record<string, string> = {
  circleCheck: 'circle-check',
  circleQuestion: 'circle-question',
  circleInfo: 'circle-info',
};

const toKebabCase = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `chartBar` and `chart-bar` are the same icon; so are `circleInfo` and `circle-info`. */
export const normalizeIconName = (name: string) => legacySpellings[name] ?? toKebabCase(name);

/**
 * Add glyphs, or replace existing ones — the built-in glyphs and the bundled
 * Font Awesome icons included. Replacing takes the old icon's aliases with it.
 *
 * Each value may be a glyph, a Font Awesome `IconDefinition` in any style, or
 * a Lucide `IconNode`; the last two are converted with `fromFontAwesome` and
 * `fromLucide`. Anything else throws, naming the entry.
 */
export function registerIconGlyphs(glyphs: Readonly<Record<string, IconGlyphInput>>) {
  for (const [name, input] of Object.entries(glyphs)) {
    const glyph = toIconGlyph(input, name);
    const previous = registered.get(name);
    if (previous) unregisterAliases(previous);

    registered.set(name, glyph);
    registerAliases(glyph);
  }
}

/** A role's own name, or a glyph name, to whatever draws it. */
const lookup = (name: string): IconGlyph | undefined =>
  registered.get(name) ?? aliases.get(name) ?? resolveCustomGlyph(name);

/**
 * The glyph a name draws: registered, a role, an alias or a built-in glyph,
 * in that order. Undefined when nothing draws it.
 */
export function resolveIconGlyph(name: string): IconGlyph | undefined {
  const normalized = normalizeIconName(name);

  if (isIconRole(normalized)) {
    return registered.get(normalized) ?? lookup(ICON_ROLES[normalized]);
  }
  return lookup(normalized);
}

/**
 * A whole icon set: any of the roles, plus any other names the consumer's own
 * markup uses.
 */
export type IconSet<T = IconGlyphInput> = { readonly [role in IconRole]?: T } & {
  readonly [name: string]: T;
};

/**
 * Register a whole set in one call, and learn which roles it left on the
 * built-in defaults.
 *
 * `convert` turns each value into something the registry accepts, for a set
 * whose icons are in some other shape; a Font Awesome definition or a Lucide
 * node needs none. A role counts as covered when the set names the role or
 * the glyph name the role defaults to, because either one changes what the
 * role draws.
 *
 * The return value is the point of this over `registerIconGlyphs`: a swapped
 * set that misses one role still draws the built-in glyph there, beside a UI
 * drawn in something else, and the list says which.
 */
export function registerIconSet<T = IconGlyphInput>(
  icons: IconSet<T>,
  convert?: (icon: T, name: string) => IconGlyphInput,
): IconRole[] {
  const glyphs: Record<string, IconGlyphInput> = {};
  for (const [name, icon] of Object.entries(icons) as [string, T][]) {
    glyphs[name] = convert ? convert(icon, name) : (icon as unknown as IconGlyphInput);
  }
  registerIconGlyphs(glyphs);

  const names = new Set(Object.keys(glyphs).map(normalizeIconName));
  return getIconRoles().filter((role) => !names.has(role) && !names.has(ICON_ROLES[role]));
}

/** Registered names, sorted. Aliases are not included. */
export const getRegisteredIconNames = () => [...registered.keys()].sort();

/**
 * Every name that draws something with nothing further registered: the
 * registered names and the built-in glyphs, sorted. Roles and aliases are
 * not included — `getIconRoles()` lists the roles.
 */
export const getAvailableIconNames = () =>
  [...new Set([...getRegisteredIconNames(), ...getCustomGlyphNames()])].sort();

/** The built-in glyphs, the ones with no Font Awesome equivalent. */
export const getCustomIconNames = (): string[] => getCustomGlyphNames();

/**
 * The attributes needed to draw a Font Awesome definition as an `<svg>`.
 *
 * Neither layer draws through this any more — both draw an `IconGlyph`, which
 * is what `fromFontAwesome` produces, and which also gets a duotone icon's
 * secondary opacity right. Kept for callers outside the library.
 */
export interface IconPaths {
  viewBox: string;
  /** One or more path `d` values — Font Awesome's duotone icons carry two. */
  paths: string[];
}

export function getIconPaths(glyph: FontAwesomeIconDefinition): IconPaths {
  const [width, height, , , pathData] = glyph.icon;
  return {
    viewBox: `0 0 ${width} ${height}`,
    paths: Array.isArray(pathData) ? pathData : [pathData],
  };
}

/**
 * The role that stands for each severity.
 *
 * Both `Alert` and `Notification` carried identical copies of a map from
 * severity to a Font Awesome name, and `<pf-notification>` would have made a
 * third. The severities are roles now, so the answer is the severity itself —
 * kept as a function so the components still have one place to ask, and so a
 * severity that ever stops being a role has somewhere to go.
 */
export function severityIconName(
  variant: 'info' | 'success' | 'warning' | 'danger',
): Extract<IconRole, 'info' | 'success' | 'warning' | 'danger'> {
  switch (variant) {
    case 'success':
    case 'warning':
    case 'danger':
      return variant;
    default:
      return 'info';
  }
}
