/// <reference types="vite/client" />
import {
  faCalendar,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faCopy,
  faSquareCaretLeft,
  faSquareCaretRight,
  faSquareCheck,
  faStar,
  faChartBar,
} from '@fortawesome/free-regular-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
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
};

const regularIcons: Record<string, IconDefinition> = {
  calendar: faCalendar,
  'chart-bar': faChartBar,
  'circle-check': faCircleCheck,
  'circle-question': faCircleQuestion,
  'circle-xmark': faCircleXmark,
  copy: faCopy,
  'square-caret-left': faSquareCaretLeft,
  'square-caret-right': faSquareCaretRight,
  'square-check': faSquareCheck,
  star: faStar,
};

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

export const getCustomIconNames = () => Object.keys(customIcons).sort();

export interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  name: IconName;
  label?: string;
}

export function Icon({
  name,
  label,
  className,
  style,
  ref: _ref,
  ...props
}: IconProps) {
  const customIcon = customIcons[name];
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
  const faIcon = regularIcons[normalizedName] ?? regularAliases[normalizedName];

  if (!faIcon) {
    if (import.meta.env.DEV) {
      console.warn(
        `[Icon] Unknown icon name: "${name}". Check getAvailableIconNames() for valid options.`,
      );
    }
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
