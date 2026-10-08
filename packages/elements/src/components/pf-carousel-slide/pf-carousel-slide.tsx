import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One slide of a `pf-carousel`.
 *
 * The carousel tells it where it sits and whether it is the one on show; it
 * owns only what that means for itself — chiefly that an off-screen slide is
 * `inert`, so the focusable content inside it cannot be tabbed to while it is
 * scrolled out of sight.
 *
 * @slot - the slide's content.
 */
@Component({
  tag: 'pf-carousel-slide',
  styleUrl: 'pf-carousel-slide.css',
  shadow: true,
})
export class PfCarouselSlide {
  /** Set by the carousel: the slide on show. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) active = false;

  /** Set by the carousel: this slide's place, counting from 1. */
  @Prop({ mutable: true }) position = 1;

  /** Set by the carousel: how many slides there are. */
  @Prop({ mutable: true }) total = 1;

  render() {
    return (
      <Host
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${this.position} of ${this.total}`}
        aria-hidden={this.active ? null : 'true'}
        /*
         * `inert` as well as `aria-hidden`: the slide is still laid out, just
         * scrolled out of view, so without it a button inside the next slide
         * is a tab stop nobody can see. The same reason an accordion's closed
         * panel is inert.
         */
        inert={!this.active}
      >
        <slot />
      </Host>
    );
  }
}
