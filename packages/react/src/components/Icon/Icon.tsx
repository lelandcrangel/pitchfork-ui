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
  type CustomGlyph as CustomGlyphData,
  type CustomGlyphName,
  customGlyphAttributes,
  getCustomGlyphNames,
  getRegisteredIconNames,
  normalizeIconName,
  registerIconGlyphs,
  resolveCustomGlyph,
  resolveIconGlyph,
} from '@pitchfork-ui/core';
import { cx } from '../../utils/cx';
import './Icon.css';

/**
 * The custom glyphs, rendered from the shared data in @pitchfork-ui/core.
 *
 * The geometry used to be written here as JSX and a second time as Stencil JSX
 * in `pf-icon/custom-icons.tsx`. Two copies of a shape agree on the day they
 * are written, and no test in either layer could have seen them stop agreeing,
 * because each one only ever rendered its own. Core holds the shapes; this
 * maps them to React's camelCase presentation attributes.
 */
function CustomGlyph({ glyph }: { glyph: CustomGlyphData }) {
  const { viewBox, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin } =
    customGlyphAttributes(glyph);

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
      {glyph.shapes.map((shape, index) => {
        if (shape.kind === 'polyline') return <polyline key={index} points={shape.points} />;
        if (shape.kind === 'circle') {
          return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
        }
        return <path key={index} d={shape.d} />;
      })}
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

export type RegisteredIconName = CustomGlyphName | keyof typeof bundledRegularIcons;

/**
 * A registered name, or any other string: `registerIcons()` can add names at
 * runtime that no type here can know about. The union is what editors offer;
 * the `string` keeps a registered name from being a type error.
 */
export type IconName = RegisteredIconName | (string & {});

/**
 * The registry lives in @pitchfork-ui/core so that React components and
 * custom elements resolve the same names: a consumer who calls
 * `registerIcons()` must get the icon in both, and a registry per layer would
 * give them one or the other.
 */
registerIconGlyphs(bundledRegularIcons);

export const registerIcons = (icons: Record<string, IconDefinition>) => {
  registerIconGlyphs(icons);

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
      "': <the icon> }) from @fortawesome/free-regular-svg-icons.",
  );
};

export const getAvailableIconNames = () => {
  return [...new Set([...getRegisteredIconNames(), ...getCustomGlyphNames()])].sort();
};

export const getCustomIconNames = () => getCustomGlyphNames();

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

export function Icon({ name, label, className, style, ...props }: IconProps) {
  const normalizedName = normalizeIconName(name);

  // Normalized as well as raw: `legacyAliases` maps `circleInfo` to
  // `circle-info`, which is a custom SVG -- and a raw-only lookup here meant
  // that mapping never took effect. `circleInfo` and `magnifyingGlass`
  // rendered nothing.
  const customGlyph = resolveCustomGlyph(name) ?? resolveCustomGlyph(normalizedName);
  if (customGlyph !== undefined) {
    return (
      <span
        className={cx('pf-icon', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        style={style}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        <CustomGlyph glyph={customGlyph} />
      </span>
    );
  }

  // core's registry is structurally typed so that core imports nothing;
  // everything registered here is a real IconDefinition.
  const faIcon = resolveIconGlyph(name) as IconDefinition | undefined;

  if (!faIcon) {
    warnUnknownIcon(name);
    return null;
  }

  return (
    <FontAwesomeIcon
      icon={faIcon}
      className={cx('pf-icon', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      style={style}
      {...props}
    />
  );
}

Icon.displayName = 'Icon';
