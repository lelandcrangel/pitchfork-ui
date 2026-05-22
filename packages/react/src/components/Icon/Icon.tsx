import { far } from '@fortawesome/free-regular-svg-icons';
import type { IconDefinition, IconPack } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { cx } from '../../utils/cx';
import './Icon.css';

export type IconName = string;

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
  return [...new Set([...Object.keys(regularIcons), ...Object.keys(regularAliases)])].sort();
};

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

const resolveIcon = (name: IconName) => {
  const normalizedName = normalizeName(name);
  return regularIcons[normalizedName] ?? regularAliases[normalizedName];
};

export function Icon({
  name,
  label,
  className,
  ...props
}: IconProps) {
  const icon = resolveIcon(name);

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
