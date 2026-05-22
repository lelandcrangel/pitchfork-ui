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

const getInitials = (name?: string) => {
  if (!name) {
    return '?';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    { src, alt, name, size = 'md', status, className, children, ...props },
    ref,
  ) => {
    const initials = children ?? getInitials(name);

    return (
      <span
        ref={ref}
        className={cx('pf-avatar', `pf-avatar--${size}`, className)}
        aria-label={name}
        {...props}
      >
        {src ? (
          <img
            className="pf-avatar__image"
            src={src}
            alt={alt ?? name ?? 'Avatar'}
          />
        ) : (
          <span className="pf-avatar__fallback" aria-hidden>
            {initials}
          </span>
        )}

        {status ? (
          <span
            className={cx('pf-avatar__status', `pf-avatar__status--${status}`)}
            aria-hidden
          />
        ) : null}
      </span>
    );
  },
);

Avatar.displayName = 'Avatar';
