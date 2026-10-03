/**
 * The markup the fast project can see. Everything about the select's keyboard,
 * its listbox and its form association is in `pf-select`'s browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-option';

describe('pf-option', () => {
  it('announces itself as an option', async () => {
    const { root } = await render(`<pf-option value="a">Apple</pf-option>`);

    expect(root.getAttribute('role')).toBe('option');
    expect(root.getAttribute('aria-selected')).toBe('false');
  });

  /* The select writes these back; the stylesheet selects on the reflection. */
  it('reflects selected and active, which the select sets', async () => {
    const { root } = await render(`<pf-option value="a" selected active>Apple</pf-option>`);

    expect(root.hasAttribute('selected')).toBe(true);
    expect(root.hasAttribute('active')).toBe(true);
    expect(root.getAttribute('aria-selected')).toBe('true');
  });

  it('reflects disabled, and says so to a screen reader', async () => {
    const { root } = await render(`<pf-option value="a" disabled>Apple</pf-option>`);

    expect(root.hasAttribute('disabled')).toBe(true);
    expect(root.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not claim to be disabled when it is not', async () => {
    const { root } = await render(`<pf-option value="a">Apple</pf-option>`);
    expect(root.getAttribute('aria-disabled')).toBeNull();
  });

  it('reflects value, so a selector can find it', async () => {
    const { root } = await render(`<pf-option value="apple">Apple</pf-option>`);
    expect(root.getAttribute('value')).toBe('apple');
  });

  it('renders its label through a slot, so it can hold markup', async () => {
    const { root } = await render(`<pf-option value="a"><strong>Apple</strong></pf-option>`);

    expect(root.shadowRoot?.querySelector('slot')).not.toBeNull();
    expect(root.querySelector('strong')?.textContent).toBe('Apple');
  });

  it('asks to be chosen when clicked', async () => {
    const { root } = await render(`<pf-option value="apple">Apple</pf-option>`);
    const chosen: string[] = [];
    root.addEventListener('pfOptionSelect', (event) => {
      chosen.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    root.click();
    expect(chosen).toEqual(['apple']);
  });

  it('swallows its own click when disabled', async () => {
    const { root } = await render(`<pf-option value="apple" disabled>Apple</pf-option>`);
    let asked = false;
    root.addEventListener('pfOptionSelect', () => {
      asked = true;
    });

    root.click();
    expect(asked).toBe(false);
  });
});
