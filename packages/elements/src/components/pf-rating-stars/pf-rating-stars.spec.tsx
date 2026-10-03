/**
 * Both rating elements are pure rendering over core's arithmetic, so the fast
 * project covers them. The fills are inline custom properties rather than
 * computed widths, which is exactly what this project can read.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-rating-stars';
import '../pf-rating-badge/pf-rating-badge';

const stars = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('[part="star"]') ?? []) as HTMLElement[];
const fills = (root: HTMLElement) =>
  stars(root).map((star) => star.style.getPropertyValue('--pf-rating-fill'));
const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-rating-stars', () => {
  it('is one image of the rating, named by its value', async () => {
    const { root } = await render(`<pf-rating-stars value="3.5"></pf-rating-stars>`);

    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Rating 3.5 out of 5');
    // Every star inside is hidden: the name is the thing worth announcing.
    expect(part(root, 'track')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(
      `<pf-rating-stars value="4" label="Four out of five dentists"></pf-rating-stars>`,
    );
    expect(root.getAttribute('aria-label')).toBe('Four out of five dentists');
  });

  it('renders one star per point of the scale', async () => {
    const { root: five } = await render(`<pf-rating-stars value="2"></pf-rating-stars>`);
    expect(stars(five)).toHaveLength(5);

    const { root: ten } = await render(`<pf-rating-stars value="2" max="10"></pf-rating-stars>`);
    expect(stars(ten)).toHaveLength(10);
  });

  /* Core's arithmetic: the star the value lands in fills by its fraction. */
  it('fills whole stars, part of one, and none of the rest', async () => {
    const { root } = await render(`<pf-rating-stars value="3.5"></pf-rating-stars>`);
    expect(fills(root)).toEqual(['100%', '100%', '100%', '50%', '0%']);
  });

  it('clamps a rating outside the scale', async () => {
    const { root: over } = await render(`<pf-rating-stars value="9"></pf-rating-stars>`);
    expect(fills(over)).toEqual(['100%', '100%', '100%', '100%', '100%']);
    expect(over.getAttribute('aria-label')).toBe('Rating 5 out of 5');

    const { root: under } = await render(`<pf-rating-stars value="-3"></pf-rating-stars>`);
    expect(fills(under)).toEqual(['0%', '0%', '0%', '0%', '0%']);
    expect(under.getAttribute('aria-label')).toBe('Rating 0 out of 5');
  });

  /*
   * `max` builds the row, so it is coerced: an attribute arrives as a string,
   * and `Array.from({length: "5"})` is empty rather than five.
   */
  it('builds the row from a max given as an attribute', async () => {
    const { root } = await render(`<pf-rating-stars value="1" max="3"></pf-rating-stars>`);
    expect(stars(root)).toHaveLength(3);
    expect(fills(root)).toEqual(['100%', '0%', '0%']);
  });

  it('renders an empty row for a nonsense max rather than throwing', async () => {
    const { root } = await render(`<pf-rating-stars value="1" max="oops"></pf-rating-stars>`);
    expect(stars(root)).toHaveLength(0);
  });

  it('sizes the stars from the size prop', async () => {
    const { root } = await render(`<pf-rating-stars value="1" size="24"></pf-rating-stars>`);
    expect(stars(root)[0].style.getPropertyValue('--pf-rating-size')).toBe('24px');
  });

  it('writes the rating out only when asked', async () => {
    const { root: without } = await render(`<pf-rating-stars value="3.5"></pf-rating-stars>`);
    expect(part(without, 'value')).toBeNull();

    const { root: with_ } = await render(
      `<pf-rating-stars value="3.5" show-value></pf-rating-stars>`,
    );
    expect(part(with_, 'value')?.textContent).toBe('3.5');
  });

  /* One decimal always, core's, so a row of ratings lines up. */
  it('writes a whole rating with its decimal place', async () => {
    const { root } = await render(`<pf-rating-stars value="4" show-value></pf-rating-stars>`);
    expect(part(root, 'value')?.textContent).toBe('4.0');
  });
});

describe('pf-rating-badge', () => {
  it('writes the rating out of the maximum', async () => {
    const { root } = await render(`<pf-rating-badge value="4.5"></pf-rating-badge>`);
    expect(part(root, 'value')?.textContent).toBe('4.5/5.0');
  });

  it('clamps the rating', async () => {
    const { root } = await render(`<pf-rating-badge value="9"></pf-rating-badge>`);
    expect(part(root, 'value')?.textContent).toBe('5.0/5.0');
  });

  /*
   * No count at all is different from a count of zero: one is a product whose
   * reviews are not being shown, the other a product nobody has reviewed.
   */
  it('shows a review count, including none at all', async () => {
    const { root: many } = await render(
      `<pf-rating-badge value="4.5" reviews="1234"></pf-rating-badge>`,
    );
    expect(part(many, 'reviews')?.textContent).toBe('(1,234)');

    const { root: zero } = await render(
      `<pf-rating-badge value="0" reviews="0"></pf-rating-badge>`,
    );
    expect(part(zero, 'reviews')?.textContent).toBe('(0)');

    const { root: omitted } = await render(`<pf-rating-badge value="4.5"></pf-rating-badge>`);
    expect(part(omitted, 'reviews')).toBeNull();
  });

  it('defaults to the md size and takes sm', async () => {
    const { root: md } = await render(`<pf-rating-badge value="4"></pf-rating-badge>`);
    expect(md.getAttribute('size')).toBe('md');

    const { root: sm } = await render(`<pf-rating-badge value="4" size="sm"></pf-rating-badge>`);
    expect(sm.getAttribute('size')).toBe('sm');
  });

  it('hides the star from the accessibility tree', async () => {
    const { root } = await render(`<pf-rating-badge value="4"></pf-rating-badge>`);
    expect(part(root, 'icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
