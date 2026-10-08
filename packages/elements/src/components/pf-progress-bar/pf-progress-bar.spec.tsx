import { describe, expect, it, render } from '@stencil/vitest';
import './pf-progress-bar';

const fill = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="fill"]') as HTMLElement;
const readout = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="value"]');

describe('pf-progress-bar', () => {
  it('announces itself as a progressbar with the full range', async () => {
    const { root } = await render(`<pf-progress-bar value="30" label="Upload"></pf-progress-bar>`);

    expect(root.getAttribute('role')).toBe('progressbar');
    expect(root.getAttribute('aria-label')).toBe('Upload');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('100');
    expect(root.getAttribute('aria-valuenow')).toBe('30');
  });

  /*
   * aria-valuenow is on the max scale, not the percentage scale: 30 of 60 is
   * half done, and a screen reader should say 30, not 50.
   */
  it('reports aria-valuenow on the consumer’s own scale', async () => {
    const { root } = await render(`<pf-progress-bar value="30" max="60"></pf-progress-bar>`);

    expect(root.getAttribute('aria-valuemax')).toBe('60');
    expect(root.getAttribute('aria-valuenow')).toBe('30');
    expect(fill(root).style.getPropertyValue('--pf-progress-fill')).toBe('50%');
  });

  it('clamps an out-of-range value at both ends', async () => {
    const over = await render(`<pf-progress-bar value="150"></pf-progress-bar>`);
    expect(fill(over.root).style.getPropertyValue('--pf-progress-fill')).toBe('100%');
    expect(over.root.getAttribute('aria-valuenow')).toBe('100');

    const under = await render(`<pf-progress-bar value="-20"></pf-progress-bar>`);
    expect(fill(under.root).style.getPropertyValue('--pf-progress-fill')).toBe('0%');
    expect(under.root.getAttribute('aria-valuenow')).toBe('0');
  });

  it('draws nothing rather than NaN when max is zero', async () => {
    const { root } = await render(`<pf-progress-bar value="10" max="0"></pf-progress-bar>`);

    expect(fill(root).style.getPropertyValue('--pf-progress-fill')).toBe('0%');
    expect(root.getAttribute('aria-valuenow')).toBe('0');
  });

  it('shows a rounded percentage by default and hides it on request', async () => {
    const shown = await render(`<pf-progress-bar value="1" max="3"></pf-progress-bar>`);
    expect(readout(shown.root)?.textContent).toBe('33%');

    const { root } = await render(
      `<pf-progress-bar value="50" show-value="false"></pf-progress-bar>`,
    );
    expect(readout(root)).toBeNull();
  });
});
