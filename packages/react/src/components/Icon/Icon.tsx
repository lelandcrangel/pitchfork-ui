import { far } from '@fortawesome/free-regular-svg-icons';
import type {
  IconDefinition,
  IconPack,
} from '@fortawesome/fontawesome-svg-core';
import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cx } from '../../utils/cx';
import './Icon.css';

export type IconName = string;

// Custom SVGs not available in the free-regular FA set
const customIcons: Record<string, React.ReactNode> = {
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
};

const toLookup = (pack: IconPack) => {
  const lookup: Record<string, IconDefinition> = {};

  Object.values(pack).forEach((item) => {
    if (item && typeof item === 'object' && 'iconName' in item) {
      const icon = item as IconDefinition;
      lookup[icon.iconName] = icon;
    }
  });

  return lookup;
};

const regularIcons = toLookup(far);

const toAliasLookup = (icons: Record<string, IconDefinition>) => {
  const lookup: Record<string, IconDefinition> = {};

  Object.values(icons).forEach((icon) => {
    const aliases = icon.icon?.[2];

    if (!Array.isArray(aliases)) {
      return;
    }

    aliases.forEach((alias) => {
      if (typeof alias === 'string') {
        lookup[alias] = icon;
      }
    });
  });

  return lookup;
};

const regularAliases = toAliasLookup(regularIcons);

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
  return [
    ...new Set([
      ...Object.keys(regularIcons),
      ...Object.keys(regularAliases),
      ...Object.keys(customIcons),
    ]),
  ].sort();
};

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

const resolveIcon = (name: IconName) => {
  // Check for custom chevrons first
  if (customIcons[name]) {
    return customIcons[name];
  }
  const normalizedName = normalizeName(name);
  return regularIcons[normalizedName] ?? regularAliases[normalizedName];
};

export function Icon({ name, label, className, style, ref: _ref, ...props }: IconProps) {
  const icon = resolveIcon(name);

  // Always apply the CSS variable for color
  const mergedStyle = { ...style, color: 'var(--pf-icon-color, currentColor)' };

  // Render custom icons directly — span is intentional (not SVGSVGElement)
  if (customIcons[name]) {
    return (
      <span
        className={cx('pf-icon', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        style={mergedStyle}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {icon}
      </span>
    );
  }

  if (!icon) {
    return null;
  }

  return (
    <FontAwesomeIcon
      icon={icon}
      className={cx('pf-icon', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      style={mergedStyle}
      {...props}
    />
  );
}
