import { resolveStepStatuses, type StepStatus } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, Watch } from '@stencil/core';

export type PfProgressStepsOrientation = 'horizontal' | 'vertical';

/**
 * A step indicator over `pf-progress-step` children.
 *
 * The group owns everything a step cannot see on its own: its number, whether
 * it is last — so only the others draw a connector — the orientation, and the
 * status inference, which depends on where the current step is.
 *
 * @slot - the `pf-progress-step` children.
 */
@Component({
  tag: 'pf-progress-steps',
  styleUrl: 'pf-progress-steps.css',
  shadow: true,
})
export class PfProgressSteps {
  @Element() el!: HTMLElement;

  /** Layout. Reflected, and pushed down onto every step. */
  @Prop({ reflect: true }) orientation: PfProgressStepsOrientation = 'horizontal';

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('orientation')
  handleOrientationChange() {
    this.sync();
  }

  /**
   * Re-reads the children, for a consumer who set a step's status through its
   * *property* — which leaves no attribute and fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested indicator owns its own steps. */
  private get steps(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-progress-step')).filter(
      (step) => step.parentElement === this.el,
    );
  }

  /**
   * The property if the step has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private askedStatus(step: HTMLElement): StepStatus | undefined {
    const asProp = (step as HTMLElement & { status?: StepStatus }).status;
    return asProp ?? (step.getAttribute('status') as StepStatus | null) ?? undefined;
  }

  /**
   * Core's inference, so the React `ProgressSteps` reads the same trail the
   * same way.
   *
   * The answer goes to `state`, never to the `status` a consumer asked with —
   * the lesson `pf-breadcrumbs` learned the hard way. Writing it back would
   * make the first step of an unmarked trail look explicitly `current`, and
   * prepending a step would then leave the mark behind on it.
   */
  private sync() {
    const steps = this.steps;
    const statuses = resolveStepStatuses(steps.map((step) => ({ status: this.askedStatus(step) })));

    for (const [index, step] of steps.entries()) {
      const node = step as HTMLElement & {
        state: StepStatus;
        position: number;
        last: boolean;
        orientation: PfProgressStepsOrientation;
      };
      node.state = statuses[index];
      node.position = index + 1;
      node.last = index === steps.length - 1;
      node.orientation = this.orientation;
    }
  }

  render() {
    return (
      <Host role="list">
        <slot onSlotchange={() => this.refresh()} />
      </Host>
    );
  }
}
