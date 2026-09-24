import {
  faBarChart,
  faCalendar,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faCopy,
  faCreditCard,
  faSquareCaretLeft,
  faSquareCaretRight,
  faSquareCheck,
  faStar,
  faUser,
} from '@fortawesome/free-regular-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { cx } from '../../utils/cx';
import './Icon.css';

// Custom SVGs not available in the free-regular FA set
const customIcons = {
  'chevron-down': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <polyline points="5 9 12 18 19 9" />
    </svg>
  ),
  'chevron-up': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <polyline points="5 15 12 6 19 15" />
    </svg>
  ),
  'chevron-left': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <polyline points="15 5 6 12 15 19" />
    </svg>
  ),
  'chevron-right': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <polyline points="9 5 18 12 9 19" />
    </svg>
  ),
  'circle-info': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  'triangle-exclamation': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  'file-arrow-up': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 12v6" />
      <path d="m15 15-3-3-3 3" />
    </svg>
  ),
  plus: (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ),
  clock: (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  'magnifying-glass': (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  minus: (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  ),
} satisfies Record<string, React.ReactNode>;

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
  calendar: faCalendar,
  'chart-bar': faBarChart,
  'circle-check': faCircleCheck,
  'circle-question': faCircleQuestion,
  'circle-xmark': faCircleXmark,
  copy: faCopy,
  'credit-card': faCreditCard,
  'square-caret-left': faSquareCaretLeft,
  'square-caret-right': faSquareCaretRight,
  'square-check': faSquareCheck,
  star: faStar,
  user: faUser,
} satisfies Record<string, IconDefinition>;

export type RegisteredIconName = keyof typeof customIcons | keyof typeof bundledRegularIcons;

/**
 * A registered name, or any other string: `registerIcons()` can add names at
 * runtime that no type here can know about. The union is what editors offer;
 * the `string` keeps a registered name from being a type error.
 */
export type IconName = RegisteredIconName | (string & {});

/**
 * Every registered Font Awesome icon, bundled or added by the consumer. A Map
 * rather than the object literal above, because `registerIcons()` writes to it.
 */
const registeredIcons = new Map<string, IconDefinition>(Object.entries(bundledRegularIcons));

/**
 * Font Awesome records each icon's former names in `icon[2]`, so `"bar-chart"`
 * keeps working after the icon is renamed to `"chart-bar"`. Aliases lose to
 * registered names, so registering an icon under an alias is never shadowed.
 */
const aliases = new Map<string, IconDefinition>();

const registerAliases = (icon: IconDefinition) => {
  const names = icon.icon?.[2];
  if (!Array.isArray(names)) return;

  names.forEach((alias) => {
    if (typeof alias === 'string') aliases.set(alias, icon);
  });
};

registeredIcons.forEach(registerAliases);

/**
 * Add Font Awesome icons the library does not bundle.
 *
 * `Icon` resolves an explicit registry of icons, not the whole free-regular
 * set -- individually importing them is what keeps a consumer's bundle to the
 * icons actually in use. Anything else you import yourself and register once,
 * at startup, from the peer dependency you already have:
 *
 * ```tsx
 * import { faPaperPlane, faComments } from '@fortawesome/free-regular-svg-icons';
 * import { registerIcons } from '@pitchfork-ui/react';
 *
 * registerIcons({ 'paper-plane': faPaperPlane, comments: faComments });
 * ```
 *
 * Registering a name that already exists replaces it, which is how you
 * substitute a different glyph for a bundled one.
 */
export const registerIcons = (icons: Record<string, IconDefinition>) => {
  Object.entries(icons).forEach(([name, icon]) => {
    registeredIcons.set(name, icon);
    registerAliases(icon);
    // A name that failed before may now resolve, so let it warn again if it
    // is somehow still unknown.
    warnedNames.delete(name);
  });
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

const legacyAliases: Record<string, string> = {
  circleCheck: 'circle-check',
  circleQuestion: 'circle-question',
  circleInfo: 'circle-info',
};

const toKebabCase = (value: string) => {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
};

const normalizeName = (name: IconName) => {
  return legacyAliases[name] ?? toKebabCase(name);
};

export const getAvailableIconNames = () => {
  return [...new Set([...registeredIcons.keys(), ...Object.keys(customIcons)])].sort();
};

export const getCustomIconNames = () => Object.keys(customIcons).sort();

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

export function Icon({ name, label, className, style, ...props }: IconProps) {
  const customIcon = (customIcons as Record<string, React.ReactNode>)[name];
  if (customIcon !== undefined) {
    return (
      <span
        className={cx('pf-icon', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        style={style}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {customIcon}
      </span>
    );
  }

  const normalizedName = normalizeName(name);
  const faIcon = registeredIcons.get(normalizedName) ?? aliases.get(normalizedName);

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
