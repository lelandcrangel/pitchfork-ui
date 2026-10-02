/**
 * pf-slider is tested in a real browser, all of it — form-associated, so
 * ElementInternals has to be real from its first lifecycle call.
 */
import { expect, test } from 'vitest';
import './pf-slider';

type Slider = HTMLElement & {
  value: number;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-slider');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.body.firstElementChild as Slider;
};

const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for pf-slider');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const control = (el: Slider) => el.shadowRoot?.querySelector('input') as HTMLInputElement;
const readout = (el: Slider) => el.shadowRoot?.querySelector('[part="value"]')?.textContent;
const progress = (el: Slider) => control(el).style.getPropertyValue('--pf-slider-progress');

test('is a native range input, so the browser owns drag and keyboard stepping', async () => {
  const el = await mount(`<pf-slider min="0" max="10" step="2" value="4"></pf-slider>`);

  expect(control(el).type).toBe('range');
  expect(control(el).min).toBe('0');
  expect(control(el).max).toBe('10');
  expect(control(el).step).toBe('2');
  expect(control(el).value).toBe('4');
});

test('labels the control from the same root, so `for` actually associates', async () => {
  const el = await mount(`<pf-slider label="Volume"></pf-slider>`);

  expect(el.shadowRoot?.querySelector('label')?.getAttribute('for')).toBe('input');
});

/*
 * The track fills from min, not from zero: 5 on a 5..15 range is at the start,
 * not a third of the way along.
 */
test('fills the track measured from min', async () => {
  const fromZero = await mount(`<pf-slider min="0" max="10" value="5"></pf-slider>`);
  expect(progress(fromZero)).toBe('50%');

  const offset = await mount(`<pf-slider min="5" max="15" value="5"></pf-slider>`);
  expect(progress(offset)).toBe('0%');

  const middle = await mount(`<pf-slider min="5" max="15" value="10"></pf-slider>`);
  expect(progress(middle)).toBe('50%');
});

test('clamps a value outside the bounds rather than overflowing the track', async () => {
  const over = await mount(`<pf-slider min="0" max="10" value="99"></pf-slider>`);
  expect(control(over).value).toBe('10');
  expect(progress(over)).toBe('100%');

  const under = await mount(`<pf-slider min="0" max="10" value="-5"></pf-slider>`);
  expect(control(under).value).toBe('0');
  expect(progress(under)).toBe('0%');
});

/* An inverted range collapses rather than drawing backwards. */
test('survives an inverted range', async () => {
  const el = await mount(`<pf-slider min="100" max="0" value="50"></pf-slider>`);

  expect(control(el).min).toBe('100');
  expect(control(el).max).toBe('100');
  expect(progress(el)).toBe('0%');
});

test('shows a rounded readout, and hides it on request', async () => {
  const shown = await mount(`<pf-slider value="7"></pf-slider>`);
  expect(readout(shown)).toBe('7');

  const hidden = await mount(`<pf-slider value="7" show-value="false"></pf-slider>`);
  expect(readout(hidden)).toBeUndefined();
});

/* The input already reports its value through the range role. */
test('keeps the readout out of the accessibility tree', async () => {
  const el = await mount(`<pf-slider value="7"></pf-slider>`);

  expect(el.shadowRoot?.querySelector('[part="value"]')?.getAttribute('aria-hidden')).toBe('true');
});

test('reports dragging through pfInput and commits through pfChange', async () => {
  const el = await mount(`<pf-slider min="0" max="10" value="0"></pf-slider>`);
  const dragged: number[] = [];
  const committed: number[] = [];
  el.addEventListener('pfInput', (e) =>
    dragged.push((e as CustomEvent<{ value: number }>).detail.value),
  );
  el.addEventListener('pfChange', (e) =>
    committed.push((e as CustomEvent<{ value: number }>).detail.value),
  );

  const native = control(el);
  native.value = '6';
  native.dispatchEvent(new Event('input'));
  native.dispatchEvent(new Event('change'));
  // Wait for the rendered readout, not for the event: Stencil's queue is async
  // and the event lands several frames before the DOM catches up.
  await until(() => readout(el) === '6');

  expect(dragged).toEqual([6]);
  expect(committed).toEqual([6]);
  expect(progress(el)).toBe('60%');
});

test('its value reaches the surrounding form', async () => {
  document.body.innerHTML = `<form><pf-slider name="volume" value="7"></pf-slider></form>`;
  await customElements.whenDefined('pf-slider');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...new FormData(document.querySelector('form') as HTMLFormElement).entries()]).toEqual([
    ['volume', '7'],
  ]);
});

/* The clamped value is submitted, not the out-of-range one it was given. */
test('submits the clamped value, not the raw one', async () => {
  document.body.innerHTML = `<form><pf-slider name="volume" min="0" max="10" value="99"></pf-slider></form>`;
  await customElements.whenDefined('pf-slider');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...new FormData(document.querySelector('form') as HTMLFormElement).entries()]).toEqual([
    ['volume', '10'],
  ]);
});

/*
 * A slider always has a value, so `required` could never fail and the element
 * does not offer it — only an explicit error can make this control invalid.
 */
test('is valid by default and invalid only with an explicit error', async () => {
  const clean = await mount(`<pf-slider name="v"></pf-slider>`);
  expect(await clean.checkValidity()).toBe(true);

  const bad = await mount(`<pf-slider name="v" error="Pick a higher value."></pf-slider>`);
  expect(await bad.checkValidity()).toBe(false);
  expect(await bad.getValidationMessage()).toBe('Pick a higher value.');
  expect(control(bad).getAttribute('aria-invalid')).toBe('true');
});

test('restores its initial value when the form resets', async () => {
  document.body.innerHTML = `<form><pf-slider name="v" value="3"></pf-slider></form>`;
  await customElements.whenDefined('pf-slider');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;
  const el = document.querySelector('pf-slider') as Slider;

  el.value = 9;
  await until(() => control(el).value === '9');

  form.reset();
  await until(() => el.value === 3);
});

test('a disabled slider cannot be moved', async () => {
  const el = await mount(`<pf-slider disabled></pf-slider>`);

  expect(control(el).disabled).toBe(true);
});
