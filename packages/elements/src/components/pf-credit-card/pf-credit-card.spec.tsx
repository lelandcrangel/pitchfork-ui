import { describe, expect, it, render } from '@stencil/vitest';
import './pf-credit-card';

const text = (root: HTMLElement, part: string) =>
  root.shadowRoot?.querySelector(`[part="${part}"]`)?.textContent;
const values = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('[part="value"]') ?? []).map((v) => v.textContent);

describe('pf-credit-card', () => {
  it('masks all but the last four digits by default', async () => {
    const { root } = await render(
      `<pf-credit-card card-number="4111111111111111" cardholder-name="Ada" expiry="01/30"></pf-credit-card>`,
    );

    expect(text(root, 'number')).toBe('**** **** **** 1111');
  });

  it('groups the real number when unmasked', async () => {
    const { root } = await render(
      `<pf-credit-card card-number="4111111111111111" masked="false"></pf-credit-card>`,
    );

    expect(text(root, 'number')).toBe('4111 1111 1111 1111');
  });

  it('regroups a number that already carries separators', async () => {
    const { root } = await render(
      `<pf-credit-card card-number="4111-1111-1111-1111" masked="false"></pf-credit-card>`,
    );

    expect(text(root, 'number')).toBe('4111 1111 1111 1111');
  });

  it('shows the holder and expiry as given', async () => {
    const { root } = await render(
      `<pf-credit-card card-number="4111111111111111" cardholder-name="Ada Lovelace" expiry="01/30"></pf-credit-card>`,
    );

    expect(values(root)).toEqual(['Ada Lovelace', '01/30']);
  });

  /*
   * Omitting cvc leaves the field out entirely rather than rendering an empty
   * label, so the meta row does not carry a caption with nothing under it.
   */
  it('leaves the CVC field out when there is no cvc', async () => {
    const { root } = await render(
      `<pf-credit-card card-number="4111111111111111"></pf-credit-card>`,
    );

    expect(values(root)).toHaveLength(2);
  });

  it('hides the cvc while masked and reveals it when not', async () => {
    const hidden = await render(
      `<pf-credit-card card-number="4111111111111111" cvc="123"></pf-credit-card>`,
    );
    expect(values(hidden.root).at(-1)).toBe('***');

    const { root } = await render(
      `<pf-credit-card card-number="4111111111111111" cvc="123" masked="false"></pf-credit-card>`,
    );
    expect(values(root).at(-1)).toBe('123');
  });

  it('reflects brand so the stylesheet can pick the gradient', async () => {
    const plain = await render(`<pf-credit-card card-number="4111"></pf-credit-card>`);
    expect(plain.root.getAttribute('brand')).toBe('generic');
    expect(text(plain.root, 'brand')).toBe('GENERIC');

    const { root } = await render(
      `<pf-credit-card card-number="4111" brand="visa"></pf-credit-card>`,
    );
    expect(root.getAttribute('brand')).toBe('visa');
    expect(text(root, 'brand')).toBe('VISA');
  });

  it('keeps the decorative chip and glare out of the accessibility tree', async () => {
    const { root } = await render(`<pf-credit-card card-number="4111"></pf-credit-card>`);

    expect(root.shadowRoot?.querySelector('[part="chip"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(root.shadowRoot?.querySelector('[part="glare"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
