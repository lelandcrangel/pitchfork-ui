import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Kbd.css';

export type KbdSize = 'sm' | 'md';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Render a key combination joined into a single cap (e.g. `['⌘', 'K']`). */
  keys?: string[];
  size?: KbdSize;
  /** Separator shown between keys in a combo. Default `+`. */
  separator?: string;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, keys, size = 'md', separator = '+', children, ...props },
  ref,
) {
  // Combos render as one cap of joined text (e.g. "⌘ + K") rather than nested
  // per-key elements — keeping a single, contrast-resolvable element and
  // avoiding symbol-only child nodes that axe can't evaluate.
  const content = keys && keys.length > 0 ? keys.join(` ${separator} `) : children;

  return (
    <kbd ref={ref} className={cx('pf-kbd', `pf-kbd--${size}`, className)} {...props}>
      {content}
    </kbd>
  );
});

Kbd.displayName = 'Kbd';
