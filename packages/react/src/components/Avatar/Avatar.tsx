import { getAvatarInitials } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Avatar.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-avatar>`, or `PfAvatar` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-avatar>`, or `PfAvatar` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-avatar>`, or `PfAvatar` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-avatar>`, or `PfAvatar` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, name, size = 'md', status, className, children, ...props }, ref) => {
    const initials = children ?? getAvatarInitials(name);

    return (
      <span
        ref={ref}
        className={cx('pf-avatar', `pf-avatar--${size}`, className)}
        role={name ? 'img' : undefined}
        aria-label={name}
        {...props}
      >
        {src ? (
          <img className="pf-avatar__image" src={src} alt={alt ?? (name ? '' : 'Avatar')} />
        ) : (
          <span className="pf-avatar__fallback" aria-hidden>
            {initials}
          </span>
        )}

        {status ? (
          <span className={cx('pf-avatar__status', `pf-avatar__status--${status}`)} aria-hidden />
        ) : null}
      </span>
    );
  },
);

Avatar.displayName = 'Avatar';
