/**
 * The markup and the pushed-down state, which is all of this element but
 * `slotchange` and the layout — those are in the browser spec and in
 * `scripts/smoke-consumer.mjs`.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-progress-steps';
import '../pf-progress-step/pf-progress-step';

const FIXTURE = (attrs = '', second = '') => `
  <pf-progress-steps ${attrs}>
    <pf-progress-step>
      <span slot="title">Account</span>
    </pf-progress-step>
    <pf-progress-step ${second}>
      <span slot="title">Details</span>
      <span slot="description">Fill in your details.</span>
    </pf-progress-step>
    <pf-progress-step>
      <span slot="title">Confirm</span>
    </pf-progress-step>
  </pf-progress-steps>`;

const steps = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-progress-step'));
const states = (root: HTMLElement) => steps(root).map((step) => step.getAttribute('state'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const currentSteps = (root: HTMLElement) =>
  steps(root)
    .filter((step) => step.getAttribute('aria-current') === 'step')
    .map((step) => step.textContent?.trim().split('\n')[0]);

describe('pf-progress-steps', () => {
  it('is a list of list items', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('list');
    expect(steps(root).every((step) => step.getAttribute('role') === 'listitem')).toBe(true);
  });

  /* Core's inference: nothing marked means the trail has not started. */
  it('starts on the first step when nothing is marked', async () => {
    const { root } = await render(FIXTURE());
    expect(states(root)).toEqual(['current', 'upcoming', 'upcoming']);
  });

  it('completes everything before the step marked current', async () => {
    const { root } = await render(FIXTURE('', 'status="current"'));
    expect(states(root)).toEqual(['complete', 'current', 'upcoming']);
  });

  /*
   * `aria-current="step"` is what says which step the user is on — the marker
   * is aria-hidden and the statuses are colour. The React component had
   * neither until this port.
   */
  it('marks the current step, and only that one', async () => {
    const { root } = await render(FIXTURE('', 'status="current"'));
    expect(currentSteps(root)).toEqual(['Details']);
  });

  it('numbers the steps from one', async () => {
    const { root } = await render(FIXTURE());
    expect(steps(root).map((step) => part(step, 'marker')?.textContent)).toEqual(['1', '2', '3']);
  });

  it('hides the markers from the accessibility tree', async () => {
    const { root } = await render(FIXTURE());
    expect(part(steps(root)[0], 'marker-wrap')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws a connector after every step but the last', async () => {
    const { root } = await render(FIXTURE());
    const [first, second, third] = steps(root);

    expect(part(first, 'connector')).not.toBeNull();
    expect(part(second, 'connector')).not.toBeNull();
    expect(part(third, 'connector')).toBeNull();
  });

  it('pushes its orientation down onto every step', async () => {
    const { root } = await render(FIXTURE('orientation="vertical"'));
    expect(steps(root).every((step) => step.getAttribute('orientation') === 'vertical')).toBe(true);
  });

  it('defaults to horizontal', async () => {
    const { root } = await render(FIXTURE());
    expect(root.getAttribute('orientation')).toBe('horizontal');
    expect(steps(root)[0].getAttribute('orientation')).toBe('horizontal');
  });

  /*
   * The answer goes to `state`, never to the `status` a consumer asked with.
   * Writing it back would make the first step of an unmarked trail look
   * explicitly current — which is what broke `pf-breadcrumbs` on append.
   */
  it('leaves the asked status alone', async () => {
    const { root } = await render(FIXTURE());

    expect(steps(root).some((step) => step.hasAttribute('status'))).toBe(false);
    expect(states(root)).toEqual(['current', 'upcoming', 'upcoming']);
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE());

    (steps(root)[2] as HTMLElement & { status: string }).status = 'current';
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(states(root)).toEqual(['complete', 'complete', 'current']);
    expect(currentSteps(root)).toEqual(['Confirm']);
  });

  it('leaves a nested indicator its own steps', async () => {
    const { root } = await render(`
      <pf-progress-steps orientation="vertical">
        <pf-progress-step><span slot="title">Outer</span></pf-progress-step>
        <pf-progress-step>
          <span slot="title">Has a nested one</span>
          <pf-progress-steps>
            <pf-progress-step><span slot="title">Inner</span></pf-progress-step>
          </pf-progress-steps>
        </pf-progress-step>
      </pf-progress-steps>`);

    const inner = root.querySelector('pf-progress-steps') as HTMLElement;
    const innerStep = inner.querySelector('pf-progress-step') as HTMLElement;
    // Its own group numbered it 1 and made it horizontal, not the outer one.
    expect(part(innerStep, 'marker')?.textContent).toBe('1');
    expect(innerStep.getAttribute('orientation')).toBe('horizontal');
    expect(innerStep.getAttribute('state')).toBe('current');
  });
});
