/**
 * The keys and the pointer, neither of which the fast project can see: a JSX
 * `onKeyDown` is registered there under the name `keyDown` and never hears a
 * dispatched `keydown`, and a drag needs a real pointer with real capture.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-resizable';

type Resizable = HTMLElement & {
  size: number;
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (attrs = '', style = 'width: 400px; height: 200px') => {
  document.body.innerHTML = `
    <pf-resizable ${attrs} style="${style}">
      <div slot="start">First</div>
      <div slot="end">Second</div>
    </pf-resizable>`;
  await customElements.whenDefined('pf-resizable');
  await frame();
  await frame();
  return document.querySelector('pf-resizable') as Resizable;
};

const until = async (predicate: () => boolean, label = 'pf-resizable') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Resizable, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/* The separator is the control, so the keys arrive through its own focus. */
test('the arrows of its axis move the split', async () => {
  const el = await mount('size="50" step="5"');
  part(el, 'handle').focus();

  await userEvent.keyboard('{ArrowRight}');
  await until(() => el.size === 55, 'the split to grow');

  await userEvent.keyboard('{ArrowLeft}');
  await until(() => el.size === 50, 'the split to shrink');
});

test('a vertical splitter moves with up and down', async () => {
  const el = await mount('orientation="vertical" size="50" step="10"');
  part(el, 'handle').focus();

  await userEvent.keyboard('{ArrowDown}');
  await until(() => el.size === 60, 'the split to grow');

  await userEvent.keyboard('{ArrowUp}');
  await until(() => el.size === 50, 'the split to shrink');
});

/*
 * The other axis is left alone and not prevented, so a page still scrolls
 * with a horizontal splitter focused. Asserted on a real event, because
 * `defaultPrevented` is the only way to see it.
 */
test('the other axis is left to the page', async () => {
  const el = await mount('size="50"');
  const handle = part(el, 'handle');
  handle.focus();

  const prevented: boolean[] = [];
  for (const key of ['ArrowUp', 'ArrowDown']) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    handle.dispatchEvent(event);
    prevented.push(event.defaultPrevented);
  }

  await frame();
  expect(el.size).toBe(50);
  expect(prevented).toEqual([false, false]);
});

test('Home and End collapse to either bound', async () => {
  const el = await mount('size="50" min="15" max="85"');
  part(el, 'handle').focus();

  await userEvent.keyboard('{End}');
  await until(() => el.size === 85, 'the end bound');

  await userEvent.keyboard('{Home}');
  await until(() => el.size === 15, 'the start bound');
});

test('it reports every change once and nothing when it cannot move', async () => {
  const el = await mount('size="50" step="5" min="10" max="90"');
  const sizes: number[] = [];
  el.addEventListener('pfChange', (event) =>
    sizes.push((event as CustomEvent<{ size: number }>).detail.size),
  );
  part(el, 'handle').focus();

  await userEvent.keyboard('{ArrowRight}');
  await until(() => el.size === 55, 'the first step');
  await userEvent.keyboard('{End}');
  await until(() => el.size === 90, 'the end bound');
  // Already at the bound: nothing changed, so nothing is reported.
  await userEvent.keyboard('{ArrowRight}{End}');
  await frame();

  expect(sizes).toEqual([55, 90]);
});

/*
 * A real drag, with real pointer capture. The split follows the pointer as a
 * share of the host's own box, which is what makes the panel land under the
 * cursor rather than somewhere proportional to it.
 */
test('a drag moves the split to the pointer', async () => {
  const el = await mount('size="50" min="10" max="90"');
  const handle = part(el, 'handle');
  const rect = el.getBoundingClientRect();

  handle.dispatchEvent(
    new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }),
  );
  handle.dispatchEvent(
    new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: rect.left + rect.width * 0.25,
      clientY: rect.top + 10,
      bubbles: true,
      composed: true,
    }),
  );

  await until(() => el.size === 25, 'the split to follow the pointer');

  // The separator takes focus on a drag, so the keys carry straight on.
  expect(el.shadowRoot!.activeElement).toBe(handle);

  handle.dispatchEvent(
    new PointerEvent('pointerup', { pointerId: 1, bubbles: true, composed: true }),
  );
  handle.dispatchEvent(
    new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: rect.left + rect.width * 0.75,
      clientY: rect.top + 10,
      bubbles: true,
      composed: true,
    }),
  );
  await frame();
  expect(el.size).toBe(25);
});

/*
 * A drag the browser interrupts — a touch turning into a scroll gesture, a
 * window losing focus — fires `pointercancel` and no `pointerup`. Without
 * listening for it the splitter stays in a dragging state and follows the
 * pointer with no button held.
 */
test('a cancelled drag stops following the pointer', async () => {
  const el = await mount('size="50" min="10" max="90"');
  const handle = part(el, 'handle');
  const rect = el.getBoundingClientRect();

  handle.dispatchEvent(
    new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }),
  );
  handle.dispatchEvent(
    new PointerEvent('pointercancel', { pointerId: 1, bubbles: true, composed: true }),
  );
  handle.dispatchEvent(
    new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: rect.left + rect.width * 0.8,
      clientY: rect.top + 10,
      bubbles: true,
      composed: true,
    }),
  );

  await frame();
  expect(el.size).toBe(50);
});

/*
 * A splitter in a box with no length measures zero, and dividing by it gives
 * Infinity — or NaN when the pointer is at the box's own edge. Core reports
 * nothing and the size it had stands, rather than `flex-basis: NaN%` taking
 * the panel away.
 */
test('a drag in a collapsed box leaves the split alone', async () => {
  /*
   * `display: block` in the inline style as well as the width: neither test
   * project applies `styleUrl` CSS, so the host is an inline box here and an
   * inline box ignores `width` — the measurement would be of the content, not
   * of nothing.
   */
  const el = await mount('size="40"', 'display: block; width: 0; height: 0');
  const handle = part(el, 'handle');

  handle.dispatchEvent(
    new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }),
  );
  handle.dispatchEvent(
    new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      bubbles: true,
      composed: true,
    }),
  );

  await frame();
  expect(el.size).toBe(40);
  expect(part(el, 'start').style.flexBasis).toBe('40%');
});
