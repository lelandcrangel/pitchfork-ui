/**
 * The markup, the aria the separator pattern needs, and the clamping.
 *
 * The keys are **not** here, and cannot be: in Stencil's mock DOM a JSX
 * `onKeyDown` is registered under the event name `keyDown`, because
 * `'onkeydown' in window` is false there and Stencil then falls back to
 * re-casing the member name. A dispatched `keydown` never reaches it, and
 * silently — so a keyboard test written in this project would pass or fail for
 * the wrong reason. Measured; the keys are in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-resizable';

const FIXTURE = (attrs = '') => `
  <pf-resizable ${attrs}>
    <div slot="start">First</div>
    <div slot="end">Second</div>
  </pf-resizable>`;

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const handle = (root: HTMLElement) => part(root, 'handle');

describe('pf-resizable', () => {
  it('renders both panels and a separator', async () => {
    const { root } = await render(FIXTURE());

    expect(root.shadowRoot?.querySelector('slot[name="start"]')).toBeTruthy();
    expect(root.shadowRoot?.querySelector('slot[name="end"]')).toBeTruthy();
    expect(handle(root).getAttribute('role')).toBe('separator');
    expect(handle(root).getAttribute('tabindex')).toBe('0');
  });

  it('names the separator and reports its range', async () => {
    const { root } = await render(FIXTURE('size="40" min="20" max="80"'));
    const bar = handle(root);

    expect(bar.getAttribute('aria-label')).toBe('Resize panels');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('20');
    expect(bar.getAttribute('aria-valuemax')).toBe('80');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(FIXTURE('handle-label="Split the view"'));
    expect(handle(root).getAttribute('aria-label')).toBe('Split the view');
  });

  /* Side-by-side panels have a vertical separator between them. */
  it('crosses the orientation on the separator', async () => {
    const { root } = await render(FIXTURE());
    expect(handle(root).getAttribute('aria-orientation')).toBe('vertical');

    const vertical = await render(FIXTURE('orientation="vertical"'));
    expect(handle(vertical.root).getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('sizes the first panel and lets the second take the rest', async () => {
    const { root } = await render(FIXTURE('size="35"'));

    expect(part(root, 'start').style.flexBasis).toBe('35%');
    expect(part(root, 'end').style.flexBasis).toBe('');
  });

  /*
   * `NaN` would reach the DOM as `flex-basis: NaN%`, which is invalid at
   * computed-value time and collapses the panel. Core turns it into an even
   * split of the bounds, and an attribute that is not a number is exactly how
   * it arrives.
   */
  it('falls back to an even split for a size that is not a number', async () => {
    const { root } = await render(FIXTURE('size="wide" min="20" max="80"'));

    expect(part(root, 'start').style.flexBasis).toBe('50%');
    expect(handle(root).getAttribute('aria-valuenow')).toBe('50');
  });

  it('clamps a size outside the bounds', async () => {
    const { root } = await render(FIXTURE('size="99" min="10" max="60"'));
    expect(part(root, 'start').style.flexBasis).toBe('60%');
  });

  /* Narrowing the bounds cannot leave the panel outside them. */
  it('pulls the size in when the bounds narrow', async () => {
    const { root, waitForChanges } = await render(FIXTURE('size="80" min="10" max="90"'));
    const node = root as HTMLElement & { size: number; max: number };

    node.max = 50;
    await waitForChanges();

    expect(node.size).toBe(50);
    expect(part(root, 'start').style.flexBasis).toBe('50%');
  });
});
