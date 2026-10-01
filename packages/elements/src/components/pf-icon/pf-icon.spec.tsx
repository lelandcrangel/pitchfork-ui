import { describe, expect, it, render } from '@stencil/vitest';
import { registerIconGlyphs } from '@pitchfork-ui/core';
import './pf-icon';
import { getAvailableIconNames, getCustomIconNames } from './icon-names';

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

  it('lists the names it can draw, custom glyphs included', () => {
    const names = getAvailableIconNames();

    expect(names).toContain('star');
    expect(names).toContain('chevron-down');
    expect(getCustomIconNames()).toContain('triangle-exclamation');
  });
});
