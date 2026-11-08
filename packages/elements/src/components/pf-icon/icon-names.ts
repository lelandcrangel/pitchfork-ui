import {
  getAvailableIconNames as available,
  getCustomIconNames as custom,
} from '@pitchfork-ui/core';
import { getBundledIconNames } from './bundled-icons';

/** Every name `<pf-icon>` can draw without anything being registered first. */
export const getAvailableIconNames = () => available();

/** Just the built-in glyphs, the ones with no Font Awesome equivalent. */
export const getCustomIconNames = () => custom();

/** The Font Awesome names this package bundles, for the spec that checks them. */
export const bundledIconNames = () => getBundledIconNames();
