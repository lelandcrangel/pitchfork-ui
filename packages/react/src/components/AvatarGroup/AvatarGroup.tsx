import { avatarGroupLabel, splitAvatarGroup } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import { Avatar, type AvatarProps, type AvatarSize } from '../Avatar';
import './AvatarGroup.css';

export type AvatarGroupItem = Pick<AvatarProps, 'src' | 'alt' | 'name'>;

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarGroupItem[];
  /** Max avatars to show before collapsing into a +N chip. Default 5. */
  max?: number;
  /** Size applied to every avatar in the group. Default `md`. */
  size?: AvatarSize;
  /** Explicit total to compute the overflow count (defaults to `avatars.length`). */
  total?: number;
  /** Accessible label for the group. */
  label?: string;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { className, avatars, max = 5, size = 'md', total, label, ...props },
  ref,
) {
  /*
   * The split is core's, so `<pf-avatar-group>` shows the same faces and
   * counts the same overflow — including the "5 of 40" case, where the group
   * knows its size without being handed an avatar for every member.
   */
  const split = splitAvatarGroup(avatars.length, max, total);
  const shown = avatars.slice(0, split.shown);
  const overflow = split.overflow;

  return (
    <div
      ref={ref}
      className={cx('pf-avatar-group', `pf-avatar-group--${size}`, className)}
      role="group"
      aria-label={label ?? avatarGroupLabel(split.total)}
      {...props}
    >
      {shown.map((avatar, index) => (
        <Avatar
          key={index}
          size={size}
          className="pf-avatar-group__item"
          style={{ zIndex: shown.length - index }}
          {...avatar}
        />
      ))}

      {overflow > 0 ? (
        <span
          className={cx(
            'pf-avatar',
            `pf-avatar--${size}`,
            'pf-avatar-group__item',
            'pf-avatar-group__overflow',
          )}
          role="img"
          aria-label={`${overflow} more`}
          style={{ zIndex: 0 }}
        >
          <span className="pf-avatar__fallback" aria-hidden>
            +{overflow}
          </span>
        </span>
      ) : null}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';
