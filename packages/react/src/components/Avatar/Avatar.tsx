import { getAvatarInitials } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Avatar.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

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
