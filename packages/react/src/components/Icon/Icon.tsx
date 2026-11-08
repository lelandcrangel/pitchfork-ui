import {
  faBarChart,
  faBell,
  faCalendar,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faCopy,
  faCreditCard,
  faFile,
  faFolderOpen,
  faSquareCaretLeft,
  faSquareCaretRight,
  faSquareCheck,
  faStar,
  faUser,
} from '@fortawesome/free-regular-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import {
  type CustomGlyphName,
  type IconGlyph,
  type IconGlyphInput,
  type IconRole,
  getAvailableIconNames as availableIconNames,
  getCustomIconNames as customIconNames,
  glyphAttributes,
  glyphElements,
  registerIconGlyphs,
  resolveIconGlyph,
} from '@pitchfork-ui/core';
import { createElement } from 'react';
import { cx } from '../../utils/cx';
import './Icon.css';

/** `fill-rule` to `fillRule`: the one spelling React and SVG disagree on here. */
const reactAttributeName = (name: string) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * A glyph from core's one shape, whichever set it came from.
 *
 * The geometry used to be written here as JSX and a second time as Stencil JSX
 * in `pf-icon`. Core holds the shapes and decides which attributes each one
 * has (`glyphElements`), spelled as SVG spells them; this camel-cases them for
 * React.
 */
function GlyphSvg({ glyph }: { glyph: IconGlyph }) {
  const { viewBox, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin } =
    glyphAttributes(glyph);

  return (
    <svg
      width="1em"
      height="1em"
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      focusable="false"
      aria-hidden="true"
    >
      {glyphElements(glyph).map(({ tag, attributes }, index) =>
        createElement(tag, {
          key: index,
          ...Object.fromEntries(
            Object.entries(attributes).map(([name, value]) => [reactAttributeName(name), value]),
          ),
        }),
      )}
    </svg>
  );
}

/**
 * The Font Awesome regular icons bundled with the library. This is an explicit
 * registry, not the whole free-regular set: each entry is an individual import,
 * so a consumer's bundle carries only these.
 *
 * Anything outside it is not "an icon this library doesn't have" -- it is an
 * icon you can add yourself with `registerIcons()`, using the
 * `@fortawesome/free-regular-svg-icons` peer dependency you already install.
 */
const bundledRegularIcons = {
  bell: faBell,
  calendar: faCalendar,
  'chart-bar': faBarChart,
  'circle-check': faCircleCheck,
  'circle-question': faCircleQuestion,
  'circle-xmark': faCircleXmark,
  copy: faCopy,
  'credit-card': faCreditCard,
  file: faFile,
  'folder-open': faFolderOpen,
  'square-caret-left': faSquareCaretLeft,
  'square-caret-right': faSquareCaretRight,
  'square-check': faSquareCheck,
  star: faStar,
  user: faUser,
} satisfies Record<string, IconDefinition>;

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-icon>`, or `PfIcon` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type RegisteredIconName = IconRole | CustomGlyphName | keyof typeof bundledRegularIcons;

/**
 * A registered name, or any other string: `registerIcons()` can add names at
 * runtime that no type here can know about. The union is what editors offer;
 * the `string` keeps a registered name from being a type error.
 * @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-icon>`, or `PfIcon` from `@pitchfork-ui/elements-react`. See Foundations → Migrating.
 */
export type IconName = RegisteredIconName | (string & {});

/**
 * The registry lives in @pitchfork-ui/core so that React components and
 * custom elements resolve the same names: a consumer who calls
 * `registerIcons()` must get the icon in both, and a registry per layer would
 * give them one or the other.
 */
registerIconGlyphs(bundledRegularIcons);

/** @deprecated `@pitchfork-ui/react` is deprecated. The registry itself lives in `@pitchfork-ui/core`; import `registerIcons` from there and one call covers both `Icon` and `<pf-icon>`. */
export const registerIcons = (icons: Record<string, IconDefinition | IconGlyphInput>) => {
  registerIconGlyphs(icons as Record<string, IconGlyphInput>);

  for (const name of Object.keys(icons)) {
    // A name that failed before may now resolve, so let it warn again if it
    // is removed later.
    warnedNames.delete(name);
  }
};

/**
 * An unknown name renders nothing, and rendering nothing is indistinguishable
 * from an icon that happens to be invisible -- so say so, once per name.
 *
 * This deliberately is not behind `import.meta.env.DEV`. That constant is
 * replaced with `false` when this package is bundled for publication, so a
 * guarded warning is stripped from the published build entirely: consumers got
 * an empty `<span>` and no diagnostic anywhere. Once per name keeps a
 * re-rendering component from filling the console.
 */
const warnedNames = new Set<string>();

const warnUnknownIcon = (name: string) => {
  if (warnedNames.has(name)) return;
  warnedNames.add(name);

  console.warn(
    `[Icon] Unknown icon name: "${name}". This renders nothing. ` +
      'Pitchfork UI bundles an explicit set of icons rather than all of Font ' +
      'Awesome -- call getAvailableIconNames() to list them, or add this one ' +
      "with registerIcons({ '" +
      name +
      "': <the icon> }) from @fortawesome/free-regular-svg-icons, or any set " +
      'core can convert. The components ask for roles -- getIconRoles() lists them.',
  );
};

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `getAvailableIconNames` from `@pitchfork-ui/core`. */
export const getAvailableIconNames = () => availableIconNames();

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `getCustomIconNames` from `@pitchfork-ui/core`. */
export const getCustomIconNames = () => customIconNames();

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-icon>`, or `PfIcon` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-icon>`, or `PfIcon` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export function Icon({ name, label, className, style, ...props }: IconProps) {
  // One lookup, in core, for a role, a registered name, an alias or a
  // built-in glyph -- in that order. The built-in glyphs used to be checked
  // here first, so a registered chevron could never replace ours.
  const glyph = resolveIconGlyph(name);

  if (!glyph) {
    warnUnknownIcon(name);
    return null;
  }

  // A Font Awesome icon keeps Font Awesome's renderer, because `IconProps`
  // are Font Awesome's (`spin`, `size`, `flip`...) and only that renderer
  // honours them.
  if (glyph.fontAwesome) {
    return (
      <FontAwesomeIcon
        icon={glyph.fontAwesome as IconDefinition}
        className={cx('pf-icon', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        style={style}
        {...props}
      />
    );
  }

  return (
    <span
      className={cx('pf-icon', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      style={style}
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    >
      <GlyphSvg glyph={glyph} />
    </span>
  );
}

Icon.displayName = 'Icon';
