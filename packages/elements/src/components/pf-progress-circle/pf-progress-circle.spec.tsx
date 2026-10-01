import { describe, expect, it, render } from '@stencil/vitest';
import './pf-progress-circle';

const arc = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="fill"]') as SVGElement;
const track = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="track"]') as SVGElement;
const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

describe('pf-progress-circle', () => {
  it('announces itself as a progressbar on the consumer’s scale', async () => {
    const { root } = await render(
      `<pf-progress-circle value="15" max="60" label="Sync"></pf-progress-circle>`,
    );

    expect(root.getAttribute('role')).toBe('progressbar');
    expect(root.getAttribute('aria-label')).toBe('Sync');
    expect(root.getAttribute('aria-valuemax')).toBe('60');
    expect(root.getAttribute('aria-valuenow')).toBe('15');
  });

  /*
   * An SVG stroke straddles its path, so a circle of radius size/2 would have
   * half its stroke painted outside the viewBox and clipped. The radius is
   * inset by half the stroke width to keep the ring inside the box.
   */
  it('insets the radius by half the stroke so the ring is not clipped', async () => {
    const { root } = await render(
      `<pf-progress-circle value="50" size="64" stroke-width="6"></pf-progress-circle>`,
    );

    expect(num(arc(root), 'r')).toBe(29);
    expect(num(arc(root), 'cx')).toBe(32);
    expect(num(arc(root), 'cy')).toBe(32);
  });

  it('gives the track and the arc the same geometry', async () => {
    const { root } = await render(`<pf-progress-circle value="50"></pf-progress-circle>`);

    for (const attr of ['r', 'cx', 'cy', 'stroke-width']) {
      expect(num(track(root), attr)).toBe(num(arc(root), attr));
    }
  });

  /*
   * The arc only lands on the right angle if the dash offset and the dash
   * array came from the same radius — which is why core returns them together.
   */
  it('leaves half the circumference drawn at 50%', async () => {
    const { root } = await render(`<pf-progress-circle value="50"></pf-progress-circle>`);
    const circumference = num(arc(root), 'stroke-dasharray');
    const offset = Number(arc(root).style.getPropertyValue('--pf-progress-dashoffset'));

    expect(circumference).toBeCloseTo(2 * Math.PI * 29, 6);
    expect(offset).toBeCloseTo(circumference / 2, 6);
  });

  it('draws nothing at 0% and the whole ring at 100%', async () => {
    const empty = await render(`<pf-progress-circle value="0"></pf-progress-circle>`);
    const emptyArc = arc(empty.root);
    expect(Number(emptyArc.style.getPropertyValue('--pf-progress-dashoffset'))).toBeCloseTo(
      num(emptyArc, 'stroke-dasharray'),
      6,
    );

    const full = await render(`<pf-progress-circle value="100"></pf-progress-circle>`);
    expect(Number(arc(full.root).style.getPropertyValue('--pf-progress-dashoffset'))).toBeCloseTo(
      0,
      6,
    );
  });

  it('sizes itself and its viewBox from the same size prop', async () => {
    const { root } = await render(`<pf-progress-circle size="96"></pf-progress-circle>`);

    expect(root.style.getPropertyValue('--pf-progress-circle-size')).toBe('96px');
    expect(root.shadowRoot?.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 96 96');
  });

  it('keeps the svg out of the accessibility tree, since the host carries the role', async () => {
    const { root } = await render(`<pf-progress-circle value="50"></pf-progress-circle>`);
    const svg = root.shadowRoot?.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });
});
