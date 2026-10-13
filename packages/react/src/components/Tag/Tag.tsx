import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Tag.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-tag>`, or `PfTag` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type TagVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-tag>`, or `PfTag` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-tag>`, or `PfTag` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = 'neutral', dismissible = false, onDismiss, children, ...props }, ref) => (
    <span ref={ref} className={cx('pf-tag', `pf-tag--${variant}`, className)} {...props}>
      <span className="pf-tag__label">{children}</span>
      {dismissible ? (
        <button
          type="button"
          className="pf-tag__dismiss"
          aria-label="Remove tag"
          onClick={() => onDismiss?.()}
        >
          <Icon name="circle-xmark" aria-hidden />
        </button>
      ) : null}
    </span>
  ),
);

Tag.displayName = 'Tag';
