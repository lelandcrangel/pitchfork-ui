import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Tag.css';

export type TagVariant = 'neutral' | 'brand' | 'success' | 'warning';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Tag({
  className,
  variant = 'neutral',
  dismissible = false,
  onDismiss,
  children,
  ...props
}: TagProps) {
  return (
    <span className={cx('pf-tag', `pf-tag--${variant}`, className)} {...props}>
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
  );
}
