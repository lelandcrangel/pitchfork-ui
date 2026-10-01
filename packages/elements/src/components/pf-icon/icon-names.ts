import { getRegisteredIconNames } from '@pitchfork-ui/core';
import { customIcons } from './custom-icons';

/** Every name `<pf-icon>` can draw without anything being registered first. */
export const getAvailableIconNames = () =>
  [...new Set([...getRegisteredIconNames(), ...Object.keys(customIcons)])].sort();

/** Just the custom glyphs, the ones with no Font Awesome equivalent. */
export const getCustomIconNames = () => Object.keys(customIcons).sort();
