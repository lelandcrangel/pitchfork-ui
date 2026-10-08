/**
 * The markup and the selection, which is all of this element but the joined
 * borders — those are CSS, asserted against a real build in
 * `scripts/smoke-consumer.mjs` — and `slotchange`, in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-button-group';
import '../pf-button-group-item/pf-button-group-item';

const FIXTURE = (attrs = '', third = '') => `
  <pf-button-group ${attrs}>
    <pf-button-group-item value="day">Day</pf-button-group-item>
    <pf-button-group-item value="week" icon="calendar">Week</pf-button-group-item>
    <pf-button-group-item value="month" ${third}>Month</pf-button-group-item>
  </pf-button-group>`;

/* Direct children only, so a nested group's buttons are not counted here. */
const items = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('pf-button-group-item')).filter(
    (node) => node.parentElement === root,
  );
const item = (root: HTMLElement, value: string) =>
  root.querySelector(`pf-button-group-item[value="${value}"]`) as HTMLElement;
const button = (host: Element) =>
  host.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;
const pressed = (root: HTMLElement) =>
  items(root)
    .filter((node) => button(node).getAttribute('aria-pressed') === 'true')
    .map((node) => node.getAttribute('value'));

describe('pf-button-group', () => {
  it('is a group of toggle buttons', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('group');
    // `aria-pressed`, not `aria-checked`: these are toggle buttons, which is
    // also why each one is an ordinary tab stop.
    expect(items(root).every((node) => button(node).hasAttribute('aria-pressed'))).toBe(true);
  });

  it('presses the button named by value', async () => {
    const { root } = await render(FIXTURE('value="week"'));
    expect(pressed(root)).toEqual(['week']);
  });

  it('moves the selection on a click, in single mode', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="day"'));
    const changes: Array<{ value: string; values: string[] }> = [];
    root.addEventListener('pfChange', (event) =>
      changes.push((event as CustomEvent<{ value: string; values: string[] }>).detail),
    );

    button(item(root, 'month')).click();
    await waitForChanges();

    expect(pressed(root)).toEqual(['month']);
    expect(changes).toEqual([{ value: 'month', values: ['month'] }]);
  });

  /* Core's toggle, the same call pf-multi-select makes. */
  it('adds and removes in multiple mode', async () => {
    const { root, waitForChanges } = await render(FIXTURE('multiple value="day"'));

    button(item(root, 'month')).click();
    await waitForChanges();
    expect(pressed(root)).toEqual(['day', 'month']);

    button(item(root, 'day')).click();
    await waitForChanges();
    expect(pressed(root)).toEqual(['month']);
  });

  it('takes several values from one comma-separated string', async () => {
    const { root } = await render(FIXTURE('multiple value="day,month"'));
    expect(pressed(root)).toEqual(['day', 'month']);
  });

  /*
   * The group's disabled state is kept apart from the item's own, so enabling
   * the group does not enable a button the consumer disabled by itself.
   */
  it('disables every button without touching their own state', async () => {
    const { root, waitForChanges } = await render(FIXTURE('disabled', 'disabled'));
    // The group pushes the state as a property; the children's attributes and
    // their inner buttons follow on their next render.
    await waitForChanges();

    // The attribute, not the property: `button.disabled` reads undefined in
    // the mock DOM.
    expect(items(root).every((node) => button(node).hasAttribute('disabled'))).toBe(true);
    expect(items(root).map((node) => node.hasAttribute('disabled'))).toEqual([false, false, true]);
    expect(items(root).every((node) => node.hasAttribute('group-disabled'))).toBe(true);
  });

  it('refuses a click while the group is disabled', async () => {
    const { root, waitForChanges } = await render(FIXTURE('disabled'));
    const changes: string[] = [];
    root.addEventListener('pfChange', () => changes.push('x'));

    item(root, 'week').dispatchEvent(
      new CustomEvent('pfButtonGroupSelect', {
        detail: { value: 'week' },
        bubbles: true,
        composed: true,
      }),
    );
    await waitForChanges();

    expect(pressed(root)).toEqual([]);
    expect(changes).toEqual([]);
  });

  it('refuses a click on a button disabled by itself', async () => {
    const { root, waitForChanges } = await render(FIXTURE('', 'disabled'));

    item(root, 'month').dispatchEvent(
      new CustomEvent('pfButtonGroupSelect', {
        detail: { value: 'month' },
        bubbles: true,
        composed: true,
      }),
    );
    await waitForChanges();

    expect(pressed(root)).toEqual([]);
  });

  it('renders an icon and a dot when asked', async () => {
    const { root } = await render(`
      <pf-button-group>
        <pf-button-group-item value="a" icon="calendar">A</pf-button-group-item>
        <pf-button-group-item value="b" dot>B</pf-button-group-item>
        <pf-button-group-item value="c">C</pf-button-group-item>
      </pf-button-group>`);

    const part = (value: string, name: string) =>
      item(root, value).shadowRoot?.querySelector(`[part="${name}"]`);
    expect(part('a', 'icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(part('a', 'dot')).toBeNull();
    expect(part('b', 'dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(part('c', 'icon')).toBeNull();
    expect(part('c', 'dot')).toBeNull();
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="day"'));

    (item(root, 'day') as HTMLElement & { value: string }).value = 'daily';
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    // Its value no longer matches the group's, so nothing is pressed.
    expect(pressed(root)).toEqual([]);
  });

  it('leaves a nested group its own buttons', async () => {
    const { root } = await render(`
      <pf-button-group value="outer">
        <pf-button-group-item value="outer">Outer</pf-button-group-item>
        <div>
          <pf-button-group value="inner">
            <pf-button-group-item value="inner">Inner</pf-button-group-item>
          </pf-button-group>
        </div>
      </pf-button-group>`);

    expect(pressed(root)).toEqual(['outer']);
    const inner = root.querySelector('pf-button-group') as HTMLElement;
    expect(pressed(inner)).toEqual(['inner']);
  });
});
