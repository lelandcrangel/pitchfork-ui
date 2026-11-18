/**
 * What the fast project cannot reach: the transform the track is actually
 * laid out by, `inert` refusing real focus, a timer stepping on its own, and
 * `slotchange` firing when a consumer appends a slide.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-carousel';
import '../pf-carousel-slide/pf-carousel-slide';

type Carousel = HTMLElement & {
  index: number;
  loop: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
  showIndicators: boolean;
  next(): Promise<void>;
  previous(): Promise<void>;
  refresh(): Promise<void>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = (attrs = '') => `
  <pf-carousel ${attrs} label="Featured">
    <pf-carousel-slide><button id="one">One</button></pf-carousel-slide>
    <pf-carousel-slide><button id="two">Two</button></pf-carousel-slide>
    <pf-carousel-slide><button id="three">Three</button></pf-carousel-slide>
  </pf-carousel>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-carousel');
  await customElements.whenDefined('pf-carousel-slide');
  await frame();
  await frame();
  return document.querySelector('pf-carousel') as Carousel;
};

const until = async (predicate: () => boolean, label = 'pf-carousel') => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Carousel, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const dots = (el: Carousel) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>("[part='indicator']"));
const live = (el: Carousel) => el.shadowRoot!.querySelector('.sr-only') as HTMLElement;
const slides = (el: Carousel) => Array.from(el.querySelectorAll('pf-carousel-slide'));

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The percentage transform resolves against the track's own border box, so a
 * step moves the strip by exactly one of its own widths — which is what puts
 * the next slide where the last one was. Neither test project applies the
 * stylesheet, so this is about the inline `transform` the component writes,
 * read back as the matrix the browser laid out by.
 */
test('the track is translated by one of its own widths per slide', async () => {
  const el = await mount(FIXTURE());
  const track = part(el, 'track');
  const width = track.getBoundingClientRect().width;

  expect(width).toBeGreaterThan(0);
  const translationOf = (node: HTMLElement) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return matrix.m41;
  };

  expect(translationOf(track)).toBeCloseTo(0, 1);

  await el.next();
  await until(() => Math.abs(translationOf(track) + width) < 1, 'the track to step once');

  await el.next();
  await until(() => Math.abs(translationOf(track) + width * 2) < 1, 'the track to step twice');
});

/*
 * `inert` on the off-screen slides, which the fast project can only see as an
 * attribute. Here it is the thing it claims to be: the button inside the next
 * slide refuses focus, and Tab from the shown slide's button never lands on
 * it.
 */
test('a button in an off-screen slide cannot take focus', async () => {
  const el = await mount(FIXTURE());

  const first = document.querySelector('#one') as HTMLButtonElement;
  const second = document.querySelector('#two') as HTMLButtonElement;

  first.focus();
  expect(document.activeElement).toBe(first);

  second.focus();
  expect(document.activeElement).not.toBe(second);

  await el.next();
  await until(() => !slides(el)[1].hasAttribute('inert'), 'the second slide to come on show');

  second.focus();
  expect(document.activeElement).toBe(second);

  first.focus();
  expect(document.activeElement).not.toBe(first);
});

/*
 * The announcement is the only thing a reader who cannot see the carousel has
 * to go on, and it has to be the *same* node throughout: a live region added
 * at the moment it changes is not announced.
 */
test('the live region is one node whose text follows the slide', async () => {
  const el = await mount(FIXTURE());
  const region = live(el);

  expect(region.textContent).toBe('Slide 1 of 3');
  expect(region.getAttribute('aria-live')).toBe('polite');

  await userEvent.click(part(el, 'next'));
  await until(() => region.textContent === 'Slide 2 of 3', 'the announcement to follow');

  expect(live(el)).toBe(region);
});

/* Trusted clicks on the buttons and the dots, which is how a consumer steps. */
test('the buttons and the dots step with a real click', async () => {
  const el = await mount(FIXTURE('loop="false"'));
  const changes: number[] = [];
  el.addEventListener('pfSlideChange', (event) =>
    changes.push((event as CustomEvent).detail.index),
  );

  await userEvent.click(part(el, 'next'));
  await until(() => el.index === 1, 'the next button');

  await userEvent.click(dots(el)[2]);
  await until(() => el.index === 2, 'the last dot');

  await userEvent.click(part(el, 'previous'));
  await until(() => el.index === 1, 'the previous button');

  expect(changes).toEqual([1, 2, 1]);
});

/*
 * A disabled button is not a no-op handler, it is a button the browser will
 * not deliver a click to at all — which is what makes the end of a non-looping
 * carousel safe.
 */
test('the end button is disabled rather than ignoring the click', async () => {
  const el = await mount(FIXTURE('loop="false" index="2"'));
  const next = part(el, 'next') as HTMLButtonElement;

  expect(next.disabled).toBe(true);
  next.click();
  await frame();
  expect(el.index).toBe(2);
});

/*
 * Autoplay on a real timer, with a short interval so the test does not wait
 * five seconds. The timer is restarted rather than stacked, so changing the
 * interval mid-run must not leave the old one going — a stacked timer shows up
 * as a double step.
 */
test('autoplay steps on its own and the interval is replaced, not stacked', async () => {
  const el = await mount(FIXTURE('auto-play auto-play-interval="60"'));

  // The pointer is still where the tests above clicked, which is over this
  // carousel -- and autoplay now holds still under the pointer (WCAG 2.2.2).
  // Park it outside first.
  const away = document.createElement('div');
  away.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 8px; height: 8px';
  document.body.append(away);
  await userEvent.hover(away);

  await until(() => el.index === 1, 'the first automatic step');
  await until(() => el.index === 2, 'the second automatic step');
  await until(() => el.index === 0, 'the wrap back to the start');

  el.autoPlayInterval = 40;
  await frame();
  const before = el.index;
  await until(() => el.index !== before, 'a step on the new interval');

  el.autoPlay = false;
  await frame();
  await frame();
  const settled = el.index;
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(el.index).toBe(settled);
});

/*
 * `slotchange`, which the mock DOM never fires: a slide appended after mount
 * is counted, gets its label, and gets a dot of its own.
 */
test('a slide appended later is picked up', async () => {
  const el = await mount(FIXTURE());

  expect(dots(el)).toHaveLength(3);

  const added = document.createElement('pf-carousel-slide');
  added.innerHTML = '<button id="four">Four</button>';
  el.appendChild(added);

  await until(() => dots(el).length === 4, 'the new dot');
  await until(
    () => added.getAttribute('aria-label') === 'Slide 4 of 4',
    'the new slide to be told where it sits',
  );
  expect(added.hasAttribute('inert')).toBe(true);
  expect(live(el).textContent).toBe('Slide 1 of 4');
});

/*
 * The track stays in the tree when the carousel is empty, so the slot is
 * there to fire — the reason the stylesheet hides it rather than the render
 * dropping it.
 */
test('a carousel that starts empty accepts its first slide', async () => {
  const el = await mount('<pf-carousel label="Featured"></pf-carousel>');

  expect(part(el, 'empty')).toBeTruthy();
  expect(part(el, 'track')).toBeTruthy();
  expect(live(el).textContent).toBe('');

  const added = document.createElement('pf-carousel-slide');
  added.textContent = 'First';
  el.appendChild(added);

  await until(() => live(el).textContent === 'Slide 1 of 1', 'the first slide to be counted');
  expect(part(el, 'empty')).toBeNull();
  expect(added.hasAttribute('inert')).toBe(false);
});

/*
 * Autoplay stops while nobody can see the carousel, and stops the timer
 * rather than skipping its ticks: before, a 50 ms carousel in a hidden tab or
 * scrolled out of view made 10 steps and 10 timer wakeups every 500 ms. The
 * wakeups are counted by wrapping `setInterval` for the test's own interval,
 * so a version that only skipped the step would still fail.
 */
const INTERVAL = 45;

const countWakeups = () => {
  const real = window.setInterval;
  const counts = { wakeups: 0 };
  window.setInterval = ((handler: () => void, timeout?: number) =>
    real(() => {
      if (timeout === INTERVAL) counts.wakeups += 1;
      handler();
    }, timeout)) as typeof window.setInterval;
  return { counts, restore: () => (window.setInterval = real) };
};

const parkPointer = async () => {
  const away = document.createElement('div');
  away.id = 'parked-pointer';
  away.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 8px; height: 8px';
  document.body.append(away);
  await userEvent.hover(away);
};

/* Steps are counted rather than read off `index`, which six steps over three slides would wrap back to. */
const holdsStill = async (el: Carousel, timer: { wakeups: number }) => {
  let steps = 0;
  const count = () => (steps += 1);
  el.addEventListener('pfSlideChange', count);
  timer.wakeups = 0;
  await new Promise((resolve) => setTimeout(resolve, INTERVAL * 6));
  el.removeEventListener('pfSlideChange', count);
  expect(steps).toBe(0);
  expect(timer.wakeups).toBe(0);
};

test('autoplay stops while the page is hidden, and resumes when it is shown', async () => {
  const timer = countWakeups();
  try {
    const el = await mount(FIXTURE(`auto-play auto-play-interval="${INTERVAL}"`));
    await parkPointer();
    await until(() => el.index === 1, 'the first automatic step');

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await holdsStill(el, timer.counts);

    delete (document as unknown as { visibilityState?: string }).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
    const before = el.index;
    await until(() => el.index !== before, 'a step once the page is shown again');
  } finally {
    delete (document as unknown as { visibilityState?: string }).visibilityState;
    timer.restore();
  }
});

test('autoplay stops while scrolled out of view, and resumes in view', async () => {
  const timer = countWakeups();
  try {
    const el = await mount(
      `<div id="spacer" style="height: 400vh"></div>${FIXTURE(`auto-play auto-play-interval="${INTERVAL}"`)}`,
    );
    await parkPointer();
    window.scrollTo(0, 0);
    // The observer reports asynchronously; give it a few frames.
    for (let i = 0; i < 4; i += 1) await frame();
    await holdsStill(el, timer.counts);

    el.scrollIntoView();
    const before = el.index;
    await until(() => el.index !== before, 'a step once it is in view');
  } finally {
    window.scrollTo(0, 0);
    timer.restore();
  }
});
