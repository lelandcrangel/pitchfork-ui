import { describe, expect, it, render } from '@stencil/vitest';
import { BUNDLED_FA_ICON_NAMES, CUSTOM_GLYPHS, registerIconGlyphs } from '@pitchfork-ui/core';
import './pf-icon';
import { bundledIconNames, getAvailableIconNames, getCustomIconNames } from './icon-names';

const svg = (root: HTMLElement) => root.shadowRoot?.querySelector('svg') ?? null;

describe('pf-icon', () => {
  it('draws a bundled Font Awesome glyph', async () => {
    const { root } = await render(`<pf-icon name="star"></pf-icon>`);

    expect(svg(root)).not.toBeNull();
    expect(svg(root)?.querySelector('path')?.getAttribute('d')).toBeTruthy();
  });

  it('takes its viewBox from the glyph rather than assuming one', async () => {
    const { root } = await render(`<pf-icon name="star"></pf-icon>`);

    expect(svg(root)?.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/);
  });

  it('draws a custom glyph the Font Awesome set does not carry', async () => {
    const { root } = await render(`<pf-icon name="chevron-down"></pf-icon>`);

    expect(svg(root)?.querySelector('polyline')).not.toBeNull();
  });

  it('resolves a camelCase spelling', async () => {
    const { root } = await render(`<pf-icon name="chartBar"></pf-icon>`);

    expect(svg(root)).not.toBeNull();
  });

  it('resolves a camelCase spelling of a custom glyph', async () => {
    const { root } = await render(`<pf-icon name="circleInfo"></pf-icon>`);

    expect(svg(root)).not.toBeNull();
  });

  it('resolves a Font Awesome alias to the icon that replaced it', async () => {
    const { root } = await render(`<pf-icon name="bar-chart"></pf-icon>`);

    expect(svg(root)).not.toBeNull();
  });

  it('is hidden from assistive technology when it has no label', async () => {
    const { root } = await render(`<pf-icon name="star"></pf-icon>`);

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('role')).toBeNull();
  });

  it('becomes an image with an accessible name when labelled', async () => {
    const { root } = await render(`<pf-icon name="star" label="Favourite"></pf-icon>`);

    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Favourite');
    expect(root.getAttribute('aria-hidden')).toBeNull();
  });

  it('draws nothing for a name nobody registered', async () => {
    const { root } = await render(`<pf-icon name="definitely-not-an-icon"></pf-icon>`);

    expect(svg(root)).toBeNull();
  });

  it('draws it once the consumer registers it', async () => {
    registerIconGlyphs({
      'paper-plane': { icon: [512, 512, [], 'f1d8', 'M0 0h1v1H0z'] },
    });
    const { root } = await render(`<pf-icon name="paper-plane"></pf-icon>`);

    expect(svg(root)?.querySelector('path')?.getAttribute('d')).toBe('M0 0h1v1H0z');
  });

  it('exposes the glyph as a part', async () => {
    const { root } = await render(`<pf-icon name="star"></pf-icon>`);

    expect(root.shadowRoot?.querySelector('[part="svg"]')).not.toBeNull();
  });

  /*
   * The Font Awesome branch always set this; the custom glyphs did not, so
   * `pf-icon::part(svg)` reached two thirds of the icons and silently missed
   * every chevron.
   */
  it('exposes a custom glyph as the same part', async () => {
    const { root } = await render(`<pf-icon name="chevron-down"></pf-icon>`);

    expect(root.shadowRoot?.querySelector('[part="svg"]')).not.toBeNull();
  });

  /*
   * The geometry is core's, so this is where the element's rendering of it is
   * pinned: the shapes, the viewBox, and the `fill="none"` without which SVG's
   * initial black fill turns a stroked chevron into a blob.
   */
  it('renders a stroked custom glyph with the fill off', async () => {
    const { root } = await render(`<pf-icon name="chevron-down"></pf-icon>`);
    const node = svg(root);

    expect(node?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(node?.getAttribute('fill')).toBe('none');
    expect(node?.getAttribute('stroke')).toBe('currentColor');
    expect(node?.getAttribute('stroke-width')).toBe('3');
    expect(node?.querySelector('polyline')?.getAttribute('points')).toBe(
      (CUSTOM_GLYPHS['chevron-down'].shapes[0] as { points: string }).points,
    );
  });

  it('renders a filled custom glyph with no stroke', async () => {
    const { root } = await render(`<pf-icon name="ellipsis"></pf-icon>`);
    const node = svg(root);

    expect(node?.getAttribute('fill')).toBe('currentColor');
    expect(node?.getAttribute('stroke')).toBeNull();
    expect(node?.getAttribute('stroke-width')).toBeNull();
    expect(node?.querySelectorAll('circle')).toHaveLength(3);
  });

  /*
   * The custom glyphs need no such check any more -- both layers render core's
   * data, so `getCustomIconNames()` against `getCustomGlyphNames()` compares a
   * value with itself and cannot fail. (Written, probed by adding a glyph to
   * core, and deleted when it stayed green.) The Font Awesome names are the
   * part that is still per-layer, because each layer has to import the glyphs
   * individually to keep a consumer's bundle to the icons in use. A name added
   * to one layer and not the other would otherwise draw in React and render
   * nothing here, with every test in both layers passing.
   */
  it('bundles exactly the Font Awesome names core lists', () => {
    expect(bundledIconNames()).toEqual([...BUNDLED_FA_ICON_NAMES]);
  });

  it('lists the names it can draw, custom glyphs included', () => {
    const names = getAvailableIconNames();

    expect(names).toContain('star');
    expect(names).toContain('chevron-down');
    expect(getCustomIconNames()).toContain('triangle-exclamation');
  });
});
