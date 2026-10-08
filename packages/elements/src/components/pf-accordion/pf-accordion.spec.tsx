/**
 * The markup the fast project can see: the heading level, both IDREFs, which
 * sections are open, and what a click asks for.
 *
 * Arrow-key movement and `delegatesFocus` are in the browser spec — the first
 * needs real focus to move from, and the mock DOM resolves neither.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-accordion';
import '../pf-accordion-item/pf-accordion-item';

const FIXTURE = (attrs = '') => `
  <pf-accordion ${attrs}>
    <pf-accordion-item value="shipping">
      <span slot="title">Shipping</span>
      <p>Ships in two days.</p>
    </pf-accordion-item>
    <pf-accordion-item value="returns">
      <span slot="title">Returns</span>
      <p>Thirty days.</p>
    </pf-accordion-item>
    <pf-accordion-item value="warranty" disabled>
      <span slot="title">Warranty</span>
      <p>One year.</p>
    </pf-accordion-item>
  </pf-accordion>`;

const item = (root: HTMLElement, value: string) =>
  root.querySelector(`pf-accordion-item[value="${value}"]`) as HTMLElement;
const part = (host: HTMLElement, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const trigger = (root: HTMLElement, value: string) =>
  part(item(root, value), 'trigger') as HTMLButtonElement;
const openValues = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('pf-accordion-item[expanded]')).map((el) =>
    el.getAttribute('value'),
  );

describe('pf-accordion', () => {
  it('starts with every section closed', async () => {
    const { root } = await render(FIXTURE());

    expect(openValues(root)).toEqual([]);
    expect(trigger(root, 'shipping').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the sections named by value', async () => {
    const { root } = await render(FIXTURE('value="returns"'));

    expect(openValues(root)).toEqual(['returns']);
    expect(trigger(root, 'returns').getAttribute('aria-expanded')).toBe('true');
  });

  it('takes several open sections from one comma-separated value', async () => {
    const { root } = await render(FIXTURE('type="multiple" value="shipping,returns"'));

    expect(openValues(root)).toEqual(['shipping', 'returns']);
  });

  /* Core's rule, so the React Accordion opens and closes the same set. */
  it('closes the others when one opens, in single mode', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="shipping"'));

    trigger(root, 'returns').click();
    await waitForChanges();

    expect(openValues(root)).toEqual(['returns']);
    expect((root as HTMLElement & { value: string }).value).toBe('returns');
  });

  it('leaves the others open in multiple mode', async () => {
    const { root, waitForChanges } = await render(FIXTURE('type="multiple" value="shipping"'));

    trigger(root, 'returns').click();
    await waitForChanges();

    expect(openValues(root)).toEqual(['shipping', 'returns']);
  });

  it('closes an open section, leaving nothing open', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="shipping"'));

    trigger(root, 'shipping').click();
    await waitForChanges();

    expect(openValues(root)).toEqual([]);
    expect((root as HTMLElement & { value: string }).value).toBe('');
  });

  it('reports the change as a string and as an array', async () => {
    const { root, waitForChanges } = await render(FIXTURE('type="multiple" value="shipping"'));
    const changes: Array<{ value: string; values: string[] }> = [];
    root.addEventListener('pfChange', (event) =>
      changes.push((event as CustomEvent<{ value: string; values: string[] }>).detail),
    );

    trigger(root, 'returns').click();
    await waitForChanges();

    expect(changes).toEqual([{ value: 'shipping,returns', values: ['shipping', 'returns'] }]);
  });

  it('refuses a disabled section', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const changes: string[] = [];
    root.addEventListener('pfChange', () => changes.push('x'));

    // `button.disabled` reads undefined in the mock DOM, so the attribute is
    // the only thing to look at here.
    expect(trigger(root, 'warranty').hasAttribute('disabled')).toBe(true);
    // The button is disabled, so this is the group refusing it a second time:
    // a consumer can still reach the element and dispatch the event itself.
    item(root, 'warranty').dispatchEvent(
      new CustomEvent('pfAccordionToggle', {
        detail: { value: 'warranty' },
        bubbles: true,
        composed: true,
      }),
    );
    await waitForChanges();

    expect(openValues(root)).toEqual([]);
    expect(changes).toEqual([]);
  });

  it('pushes the heading level down, and coerces the attribute', async () => {
    const { root } = await render(FIXTURE('heading-level="2"'));

    // A union-literal prop arrives as a string, so `h${level}` would be built
    // from "2" and compared false to 2 anywhere a number was expected.
    expect(part(item(root, 'shipping'), 'heading')?.tagName.toLowerCase()).toBe('h2');
  });

  it('defaults the heading to h3, and clamps a level that is not one', async () => {
    const { root: byDefault } = await render(FIXTURE());
    expect(part(item(byDefault, 'shipping'), 'heading')?.tagName.toLowerCase()).toBe('h3');

    const { root: tooDeep } = await render(FIXTURE('heading-level="9"'));
    expect(part(item(tooDeep, 'shipping'), 'heading')?.tagName.toLowerCase()).toBe('h6');
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="shipping"'));

    (item(root, 'returns') as HTMLElement & { disabled: boolean }).disabled = true;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    item(root, 'returns').dispatchEvent(
      new CustomEvent('pfAccordionToggle', {
        detail: { value: 'returns' },
        bubbles: true,
        composed: true,
      }),
    );
    await waitForChanges();

    expect(openValues(root)).toEqual(['shipping']);
  });

  it('leaves a nested accordion its own sections', async () => {
    const { root } = await render(`
      <pf-accordion value="outer">
        <pf-accordion-item value="outer">
          <span slot="title">Outer</span>
          <pf-accordion value="inner">
            <pf-accordion-item value="inner"><span slot="title">Inner</span></pf-accordion-item>
          </pf-accordion>
        </pf-accordion-item>
        <pf-accordion-item value="other"><span slot="title">Other</span></pf-accordion-item>
      </pf-accordion>`);

    expect(openValues(root)).toEqual(['outer', 'inner']);
    // The outer group's own value does not mention `inner`, so if it had
    // claimed the nested item it would have closed it.
    expect(root.querySelector('pf-accordion[value="inner"] pf-accordion-item')).toHaveProperty(
      'expanded',
      true,
    );
  });
});

describe('pf-accordion-item', () => {
  it('wires the header to its panel, and the panel back', async () => {
    const { root } = await render(FIXTURE());
    const section = item(root, 'shipping');

    const header = part(section, 'trigger') as HTMLElement;
    const panel = part(section, 'content') as HTMLElement;
    expect(header.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(header.id);
    expect(panel.getAttribute('role')).toBe('region');
  });

  /* A closed panel still holds focusable content until it is made inert. */
  it('makes a closed panel inert, and an open one not', async () => {
    const { root } = await render(FIXTURE('value="shipping"'));

    expect(part(item(root, 'shipping'), 'content')?.hasAttribute('inert')).toBe(false);
    expect(part(item(root, 'returns'), 'content')?.hasAttribute('inert')).toBe(true);
  });

  /*
   * `pf-icon` is deliberately not imported by this spec, so it stays
   * un-upgraded and the `name` the vdom wrote is readable as an attribute. Once
   * it upgrades, Stencil sets the prop as a *property* and leaves no attribute
   * — which is the same trap as an unreflected prop, seen from the other side.
   */
  it('renders the chevron, hidden from the accessibility tree', async () => {
    const { root } = await render(FIXTURE());

    const icon = part(item(root, 'shipping'), 'icon') as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('pf-icon')?.getAttribute('name')).toBe('chevron-down');
  });
});
