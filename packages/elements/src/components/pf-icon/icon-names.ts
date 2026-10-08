import { getCustomGlyphNames, getRegisteredIconNames } from '@pitchfork-ui/core';
import { getBundledIconNames } from './bundled-icons';

/** Every name `<pf-icon>` can draw without anything being registered first. */
export const getAvailableIconNames = () =>
  [...new Set([...getRegisteredIconNames(), ...getCustomGlyphNames()])].sort();

/** Just the custom glyphs, the ones with no Font Awesome equivalent. */
export const getCustomIconNames = () => getCustomGlyphNames();

/** The Font Awesome names this package bundles, for the spec that checks them. */
export const bundledIconNames = () => getBundledIconNames();
