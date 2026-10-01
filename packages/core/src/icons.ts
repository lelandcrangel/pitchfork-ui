/**
 * The shared icon registry.
 *
 * Both rendering layers resolve names through this one module, so a consumer
 * who calls `registerIcons()` gets the icon in React components *and* in
 * custom elements. A registry per layer would silently give them one or the
 * other.
 *
 * Core imports nothing, so the glyph shape is declared structurally rather
 * than imported from Font Awesome. An `IconDefinition` from
 * `@fortawesome/fontawesome-svg-core` satisfies it as-is.
 */

/** Structurally compatible with Font Awesome's `IconDefinition`. */
export interface IconGlyph {
  prefix?: string;
  iconName?: string;
  /** `[width, height, aliases, unicode, pathData]` — Font Awesome's tuple. */
  icon: [number, number, string[], string, string | string[]];
}

/** Every registered glyph, bundled or added by a consumer at runtime. */
const registered = new Map<string, IconGlyph>();

/**
 * Font Awesome records an icon's former names in `icon[2]`, so `bar-chart`
 * keeps resolving after the icon was renamed to `chart-bar`. Aliases lose to
 * registered names, so registering under an alias is never shadowed.
 */
const aliases = new Map<string, IconGlyph>();

const registerAliases = (glyph: IconGlyph) => {
  const names = glyph.icon?.[2];
  if (!Array.isArray(names)) return;
  for (const alias of names) {
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
 * Add glyphs, or replace existing ones. Replacing takes the old icon's aliases
 * with it.
 */
export function registerIconGlyphs(glyphs: Record<string, IconGlyph>) {
  for (const [name, glyph] of Object.entries(glyphs)) {
    const previous = registered.get(name);
    if (previous && previous !== glyph) unregisterAliases(previous);

    registered.set(name, glyph);
    registerAliases(glyph);
  }
}

/** The glyph for a name or one of its aliases, or undefined. */
export function resolveIconGlyph(name: string): IconGlyph | undefined {
  const normalized = normalizeIconName(name);
  return registered.get(normalized) ?? aliases.get(normalized);
}

/** Registered names, sorted. Aliases are not included. */
export const getRegisteredIconNames = () => [...registered.keys()].sort();

/**
 * The attributes needed to draw a glyph as an `<svg>`. Returning data rather
 * than markup keeps this usable from any rendering layer.
 */
export interface IconPaths {
  viewBox: string;
  /** One or more path `d` values — Font Awesome's duotone icons carry two. */
  paths: string[];
}

export function getIconPaths(glyph: IconGlyph): IconPaths {
  const [width, height, , , pathData] = glyph.icon;
  return {
    viewBox: `0 0 ${width} ${height}`,
    paths: Array.isArray(pathData) ? pathData : [pathData],
  };
}
