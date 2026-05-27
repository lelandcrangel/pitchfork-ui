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

// Custom chevron SVGs (not filled, minimal, browser-like)
const customChevrons = {
  'chevron-down': (
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
      strokeWidth="2"
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
      strokeWidth="2"
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <polyline points="9 5 18 12 9 19" />
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
      ...Object.keys(customChevrons),
    ]),
  ].sort();
};

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

const resolveIcon = (name: IconName) => {
  // Check for custom chevrons first
  if (customChevrons[name]) {
    return customChevrons[name];
  }
  const normalizedName = normalizeName(name);
  return regularIcons[normalizedName] ?? regularAliases[normalizedName];
};

export function Icon({ name, label, className, ...props }: IconProps) {
  const icon = resolveIcon(name);

  // Render custom SVG chevrons directly
  if (customChevrons[name]) {
    return (
      <span
        className={cx('pf-icon', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        {...props}
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
      {...props}
    />
  );
}
