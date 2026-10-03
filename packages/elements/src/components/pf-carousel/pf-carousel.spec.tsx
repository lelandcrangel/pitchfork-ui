/**
 * The markup, the controls and the index arithmetic. The transform, the
 * announcement reaching a live region and `slotchange` are in the browser
 * spec; the colours are in `scripts/smoke-consumer.mjs`.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-carousel';
import '../pf-carousel-slide/pf-carousel-slide';

const FIXTURE = (attrs = '', count = 3) => `
  <pf-carousel ${attrs}>
    ${Array.from({ length: count }, (_, index) => `<pf-carousel-slide>Slide ${index + 1}</pf-carousel-slide>`).join('\n    ')}
  </pf-carousel>`;

type Carousel = HTMLElement & {
  index: number;
  next(): Promise<void>;
  previous(): Promise<void>;
  refresh(): Promise<void>;
};

const slides = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-carousel-slide'));
const activeIndex = (root: HTMLElement) =>
  slides(root).findIndex((slide) => slide.hasAttribute('active'));
const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const parts = (root: HTMLElement, name: string) =>
  Array.from(root.shadowRoot?.querySelectorAll(`[part="${name}"]`) ?? []) as HTMLElement[];

describe('pf-carousel', () => {
  it('is a named region that says what it is', async () => {
    const { root } = await render(FIXTURE('label="Photos"'));

    expect(root.getAttribute('role')).toBe('region');
    expect(root.getAttribute('aria-roledescription')).toBe('carousel');
    expect(root.getAttribute('aria-label')).toBe('Photos');
  });

  it('shows the first slide, and tells each one where it sits', async () => {
    const { root } = await render(FIXTURE());

    expect(activeIndex(root)).toBe(0);
    expect(slides(root).map((slide) => slide.getAttribute('aria-label'))).toEqual([
      'Slide 1 of 3',
      'Slide 2 of 3',
      'Slide 3 of 3',
    ]);
  });

  /*
   * An off-screen slide is still laid out, just scrolled out of view, so
   * `inert` is what keeps a button inside it from being a tab stop nobody can
   * see — and `aria-hidden` keeps it out of the reading order.
   */
  it('makes every slide but the shown one inert and hidden', async () => {
    const { root } = await render(FIXTURE('index="1"'));

    expect(slides(root).map((slide) => slide.hasAttribute('inert'))).toEqual([true, false, true]);
    expect(slides(root).map((slide) => slide.getAttribute('aria-hidden'))).toEqual([
      'true',
      null,
      'true',
    ]);
  });

  it('steps forward and back from the buttons', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const changes: number[] = [];
    root.addEventListener('pfChange', (event) =>
      changes.push((event as CustomEvent<{ index: number }>).detail.index),
    );

    (part(root, 'next') as HTMLButtonElement).click();
    await waitForChanges();
    expect(activeIndex(root)).toBe(1);

    (part(root, 'previous') as HTMLButtonElement).click();
    await waitForChanges();
    expect(activeIndex(root)).toBe(0);
    expect(changes).toEqual([1, 0]);
  });

  /* Core's wrap, including backwards from the first — where `%` gives -1. */
  it('wraps at both ends when it loops', async () => {
    const { root, waitForChanges } = await render(FIXTURE('loop'));

    (part(root, 'previous') as HTMLButtonElement).click();
    await waitForChanges();
    expect(activeIndex(root)).toBe(2);

    (part(root, 'next') as HTMLButtonElement).click();
    await waitForChanges();
    expect(activeIndex(root)).toBe(0);
  });

  it('stops at both ends when it does not, and dims the button', async () => {
    const { root, waitForChanges } = await render(FIXTURE('loop="false"'));

    expect((part(root, 'previous') as HTMLButtonElement).hasAttribute('disabled')).toBe(true);
    await (root as Carousel).previous();
    await waitForChanges();
    expect(activeIndex(root)).toBe(0);

    (root as Carousel).index = 2;
    await waitForChanges();
    expect((part(root, 'next') as HTMLButtonElement).hasAttribute('disabled')).toBe(true);
  });

  it('shows a dot per slide, marking the one on show', async () => {
    const { root } = await render(FIXTURE('index="1"'));

    const dots = parts(root, 'indicator');
    expect(dots).toHaveLength(3);
    expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual([null, 'true', null]);
    expect(dots[1].classList.contains('indicator--active')).toBe(true);
  });

  it('jumps to a slide from its dot', async () => {
    const { root, waitForChanges } = await render(FIXTURE());

    (parts(root, 'indicator')[2] as HTMLButtonElement).click();
    await waitForChanges();

    expect(activeIndex(root)).toBe(2);
  });

  it('can drop the dots', async () => {
    const { root } = await render(FIXTURE('show-indicators="false"'));
    expect(part(root, 'indicators')).toBeNull();
  });

  /* One slide has nothing to step to, so the controls are dead. */
  it('offers no stepping with a single slide', async () => {
    const { root } = await render(FIXTURE('', 1));

    expect(part(root, 'indicators')).toBeNull();
    expect((part(root, 'previous') as HTMLButtonElement).hasAttribute('disabled')).toBe(true);
    expect((part(root, 'next') as HTMLButtonElement).hasAttribute('disabled')).toBe(true);
  });

  it('says so when there is nothing to show', async () => {
    const { root } = await render(FIXTURE('', 0));

    expect(part(root, 'empty')?.textContent).toContain('Add at least one slide.');
    expect(part(root, 'empty')?.getAttribute('role')).toBe('status');
  });

  /*
   * The track stays in the tree with no slides in it: a slot that is not
   * rendered never fires `slotchange`, so slides added later would stay
   * invisible for good.
   */
  it('keeps the track in the tree when empty, and hides it', async () => {
    const { root } = await render(FIXTURE('', 0));

    expect(part(root, 'track')).not.toBeNull();
    expect(part(root, 'track')?.classList.contains('empty')).toBe(true);
    expect(root.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
  });

  it('resolves an index outside the range rather than showing nothing', async () => {
    const { root } = await render(FIXTURE('index="9"'));
    expect(activeIndex(root)).toBe(2);
  });

  it('re-reads the slides on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('index="2"'));

    slides(root)[2].remove();
    await (root as Carousel).refresh();
    await waitForChanges();

    expect(activeIndex(root)).toBe(1);
    expect(parts(root, 'indicator')).toHaveLength(2);
  });

  it('leaves a nested carousel its own slides', async () => {
    const { root } = await render(`
      <pf-carousel>
        <pf-carousel-slide>
          <pf-carousel index="1">
            <pf-carousel-slide>Inner one</pf-carousel-slide>
            <pf-carousel-slide>Inner two</pf-carousel-slide>
          </pf-carousel>
        </pf-carousel-slide>
        <pf-carousel-slide>Outer two</pf-carousel-slide>
      </pf-carousel>`);

    const inner = root.querySelector('pf-carousel') as HTMLElement;
    expect(activeIndex(inner)).toBe(1);
    // The outer carousel counted two slides, not four.
    expect(parts(root, 'indicator')).toHaveLength(2);
  });
});
