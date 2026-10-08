import { getAvatarInitials } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

export type PfAvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type PfAvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * A person or entity, as a photo or as initials.
 *
 * The initials are derived from `name` by core's `avatarInitials`, so this and
 * the React `Avatar` shorten the same name the same way.
 *
 * @slot - overrides the derived initials.
 * @part image - the photo, when `src` is set.
 * @part fallback - the initials, when it is not.
 * @part status - the presence dot, when `status` is set.
 */
@Component({
  tag: 'pf-avatar',
  styleUrl: 'pf-avatar.css',
  shadow: true,
})
export class PfAvatar {
  /** Photo URL. Without one the avatar shows initials. */
  @Prop() src?: string;

  /** Alternative text for the photo. */
  @Prop() alt?: string;

  /** The person's name: used for the accessible name and the initials. */
  @Prop() name?: string;

  @Prop({ reflect: true }) size: PfAvatarSize = 'md';

  /** Presence indicator. Decorative — convey it in text as well. */
  @Prop({ reflect: true }) status?: PfAvatarStatus;

  render() {
    return (
      <Host role={this.name ? 'img' : null} aria-label={this.name}>
        {this.src ? (
          <img
            class="image"
            part="image"
            src={this.src}
            alt={this.alt ?? (this.name ? '' : 'Avatar')}
          />
        ) : (
          <span class="fallback" part="fallback" aria-hidden="true">
            <slot>{getAvatarInitials(this.name)}</slot>
          </span>
        )}
        {this.status && <span class="status" part="status" aria-hidden="true"></span>}
      </Host>
    );
  }
}
