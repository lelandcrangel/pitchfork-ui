import type { StepStatus } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

import type { PfProgressStepsOrientation } from '../pf-progress-steps/pf-progress-steps';

/**
 * One step inside a `pf-progress-steps`.
 *
 * @slot title - the step's title.
 * @slot description - secondary text below the title.
 * @part marker-wrap - the box holding the marker and the connector.
 * @part marker - the numbered circle.
 * @part connector - the line to the next step. Absent on the last.
 * @part content - the box holding the title and description.
 * @part title - the title's box.
 */
@Component({
  tag: 'pf-progress-step',
  styleUrl: 'pf-progress-step.css',
  shadow: true,
})
export class PfProgressStep {
  /**
   * Set it to say where the trail has got to — usually `current` on one step,
   * and the group infers the rest.
   *
   * This is the *asking* half, which the group never writes; `state` below is
   * the answer. Keeping them apart is what lets the trail change: if the
   * answer were written back here, the first step of a trail that said nothing
   * would look explicitly `current`, and prepending a step would leave the
   * mark behind on it.
   */
  @Prop({ reflect: true }) status?: StepStatus;

  /**
   * Set by the group: the resolved status, which is what the stylesheet reads
   * and what carries `aria-current="step"` for the one current step.
   */
  @Prop({ mutable: true, reflect: true }) state: StepStatus = 'upcoming';

  /** Set by the group: the step's number, counting from 1. */
  @Prop({ mutable: true }) position = 1;

  /** Set by the group: the last step draws no connector. */
  @Prop({ mutable: true, reflect: true }) last = false;

  /** Set by the group from its own `orientation`. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) orientation: PfProgressStepsOrientation = 'horizontal';

  render() {
    return (
      <Host role="listitem" aria-current={this.state === 'current' ? 'step' : null}>
        {/* Decorative: the number repeats the step's position in the list. */}
        <div class="marker-wrap" part="marker-wrap" aria-hidden="true">
          <span class="marker" part="marker">
            {this.position}
          </span>
          {!this.last && <span class="connector" part="connector" />}
        </div>

        <div class="content" part="content">
          <p class="title" part="title">
            <slot name="title" />
          </p>
          {/*
            No wrapper around the description, deliberately: a box around a
            slot cannot be collapsed from CSS — `:not(:has(*))` never matches,
            because the slot is itself a child — so an empty one would leave
            its margin under every step without a description. An *unassigned*
            slot generates nothing, so the styling goes on `::slotted(*)` and
            the box goes away with the content.
          */}
          <slot name="description" />
        </div>
      </Host>
    );
  }
}
