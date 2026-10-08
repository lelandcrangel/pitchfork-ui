import { describe, expect, it, render } from '@stencil/vitest';
import './pf-kbd';

const kbd = (root: HTMLElement) => root.shadowRoot?.querySelector('kbd') ?? null;

describe('pf-kbd', () => {
  it('renders a native kbd element', async () => {
    const { root } = await render(`<pf-kbd>Esc</pf-kbd>`);

    expect(kbd(root)).not.toBeNull();
    expect(kbd(root)?.getAttribute('part')).toBe('kbd');
  });

  it('renders slotted content when no keys are given', async () => {
    const { root } = await render(`<pf-kbd>Esc</pf-kbd>`);

    expect(root.textContent).toBe('Esc');
  });

  // `keys` is an array, so it is a property rather than an attribute.
  it('joins a key combination into one cap', async () => {
    const { root, setProps } = await render(`<pf-kbd></pf-kbd>`);
    await setProps({ keys: ['⌘', 'K'] });

    expect(kbd(root)?.textContent).toBe('⌘ + K');
  });

  it('honours a custom separator', async () => {
    const { root, setProps } = await render(`<pf-kbd separator="then"></pf-kbd>`);
    await setProps({ keys: ['Ctrl', 'P'] });

    expect(kbd(root)?.textContent).toBe('Ctrl then P');
  });

  it('prefers keys over slotted content', async () => {
    const { root, setProps } = await render(`<pf-kbd>ignored</pf-kbd>`);
    await setProps({ keys: ['Esc'] });

    expect(kbd(root)?.textContent).toBe('Esc');
  });

  it('reflects size for the stylesheet', async () => {
    const { root } = await render(`<pf-kbd size="sm">Esc</pf-kbd>`);

    expect(root.getAttribute('size')).toBe('sm');
  });
});
