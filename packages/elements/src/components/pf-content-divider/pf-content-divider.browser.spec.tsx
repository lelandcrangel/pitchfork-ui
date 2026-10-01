/**
 * The half of pf-content-divider that only a real browser can exercise: the
 * `slotchange` event.
 *
 * `componentWillLoad` reads the light DOM, which is what lets the unit spec
 * assert the first-paint layout. Keeping it in step afterwards is `slotchange`,
 * and Stencil's mock DOM never fires that event — verified by deleting the
 * `componentWillLoad` call and watching the unit spec still pass for the static
 * case. So every assertion about a label appearing or disappearing *after*
 * first render belongs here.
 *
 * These assert class names rather than computed styles, because the browser
 * project applies no component CSS: a mounted element's shadow root has zero
 * adopted stylesheets and zero style tags (measured, not assumed — the styles
 * are bundled by the Stencil output targets, which this project does not run
 * through). The classes are what the stylesheet selects on, so they are the
 * furthest this environment can honestly reach.
 */
import { expect, test } from 'vitest';
import './pf-content-divider';

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as HTMLElement;
  await customElements.whenDefined('pf-content-divider');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
};

/**
 * Stencil's queue is `async`, so a re-render provoked by `slotchange` lands
 * some frames after the mutation — one `requestAnimationFrame` is reliably too
 * early (measured: the class is still stale after 1 frame and correct by 50ms).
 * Polling to a deadline beats picking a sleep that is either flaky or slow.
 */
const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for the divider to re-render');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

/** Rules the stylesheet will draw: every `line` not carrying `line--hidden`. */
const drawnLines = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('[part="line"]') ?? []).filter(
    (line) => !line.classList.contains('line--hidden'),
  );

const labelDrawn = (root: HTMLElement) =>
  !root.shadowRoot?.querySelector('[part="label"]')?.classList.contains('label--empty');

test('grows a second rule when a label is added after first render', async () => {
  const root = await mount(`<pf-content-divider></pf-content-divider>`);
  expect(drawnLines(root)).toHaveLength(1);
  expect(labelDrawn(root)).toBe(false);

  root.append(document.createTextNode('or'));
  await until(() => labelDrawn(root));

  expect(drawnLines(root)).toHaveLength(2);
});

test('drops back to one rule when the label is removed', async () => {
  const root = await mount(`<pf-content-divider><span>or</span></pf-content-divider>`);
  expect(drawnLines(root)).toHaveLength(2);

  root.replaceChildren();
  await until(() => !labelDrawn(root));

  expect(drawnLines(root)).toHaveLength(1);
});

test('ignores a label swapped for whitespace, as on first render', async () => {
  const root = await mount(`<pf-content-divider><span>or</span></pf-content-divider>`);
  expect(labelDrawn(root)).toBe(true);

  root.replaceChildren(document.createTextNode('\n  '));
  await until(() => !labelDrawn(root));

  expect(drawnLines(root)).toHaveLength(1);
});

test('the slotted label really is distributed, not just counted', async () => {
  const root = await mount(`<pf-content-divider>or</pf-content-divider>`);
  const slot = root.shadowRoot?.querySelector('slot') as HTMLSlotElement;

  expect(slot.assignedNodes({ flatten: true }).map((n) => n.textContent)).toEqual(['or']);
});
