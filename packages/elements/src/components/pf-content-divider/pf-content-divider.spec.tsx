import { describe, expect, it, render } from '@stencil/vitest';
import './pf-content-divider';

const lines = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('[part="line"]') ?? []);
const visibleLines = (root: HTMLElement) =>
  lines(root).filter((line) => !line.classList.contains('line--hidden'));
const label = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="label"]');

describe('pf-content-divider', () => {
  it('announces itself as a horizontal separator by default', async () => {
    const { root } = await render(`<pf-content-divider></pf-content-divider>`);

    expect(root.getAttribute('role')).toBe('separator');
    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
    expect(root.getAttribute('orientation')).toBe('horizontal');
  });

  it('announces a vertical separator when asked', async () => {
    const { root } = await render(
      `<pf-content-divider orientation="vertical"></pf-content-divider>`,
    );

    expect(root.getAttribute('aria-orientation')).toBe('vertical');
    expect(root.getAttribute('orientation')).toBe('vertical');
  });

  it('draws one rule when unlabelled', async () => {
    const { root } = await render(`<pf-content-divider></pf-content-divider>`);

    expect(visibleLines(root)).toHaveLength(1);
    expect(label(root)?.classList.contains('label--empty')).toBe(true);
  });

  it('draws a rule either side of a label, from the first render', async () => {
    const { root } = await render(`<pf-content-divider>or</pf-content-divider>`);

    expect(visibleLines(root)).toHaveLength(2);
    expect(label(root)?.classList.contains('label--empty')).toBe(false);
    expect(label(root)?.textContent).toBe('');
  });

  it('treats a formatter’s whitespace as no label', async () => {
    const { root } = await render(`<pf-content-divider>\n  \n</pf-content-divider>`);

    expect(visibleLines(root)).toHaveLength(1);
    expect(label(root)?.classList.contains('label--empty')).toBe(true);
  });

  it('keeps the rules out of the accessibility tree', async () => {
    const { root } = await render(`<pf-content-divider>or</pf-content-divider>`);

    expect(lines(root).every((line) => line.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('reflects inset so the stylesheet can pad it', async () => {
    const plain = await render(`<pf-content-divider></pf-content-divider>`);
    expect(plain.root.hasAttribute('inset')).toBe(false);

    const { root } = await render(`<pf-content-divider inset></pf-content-divider>`);
    expect(root.getAttribute('inset')).toBe('');
  });
});
