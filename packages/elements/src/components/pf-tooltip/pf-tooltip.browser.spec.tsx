/**
 * pf-tooltip is tested in a real browser, all of it.
 *
 * Nothing here works anywhere else: the panel is a `popover`, which Stencil's
 * mock DOM does not implement; the side is chosen from measured rects, and the
 * mock DOM gives every element a zero rect; and the accessible description is
 * read back from the accessibility tree's own rules.
 */
import { expect, test } from 'vitest';
import './pf-tooltip';

type Tooltip = HTMLElement & {
  open?: boolean;
  placement: string;
  delay: number;
  disabled: boolean;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-tooltip');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-tooltip') as Tooltip;
};

const until = async (predicate: () => boolean, label = 'pf-tooltip') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const panel = (el: Tooltip) => el.shadowRoot?.querySelector('[part="tooltip"]') as HTMLElement;
const isOpen = (el: Tooltip) => panel(el).matches(':popover-open');
const trigger = (el: Tooltip) => el.firstElementChild as HTMLElement;

const FIXTURE = (attrs = '') => `
  <pf-tooltip ${attrs}>
    <button>Trigger</button>
    <span slot="content">Helpful text</span>
  </pf-tooltip>`;

test('the panel is a tooltip-roled popover, closed to begin with', async () => {
  const el = await mount(FIXTURE());

  expect(panel(el).getAttribute('role')).toBe('tooltip');
  expect(panel(el).getAttribute('popover')).toBe('manual');
  expect(isOpen(el)).toBe(false);
});

/*
 * An IDREF cannot cross a shadow boundary and `ariaDescribedByElements` reads
 * back empty for an element from another root — both measured — so the text is
 * copied onto the trigger, which the accessibility tree honours identically.
 */
test('describes the trigger with the content text', async () => {
  const el = await mount(FIXTURE());

  expect(trigger(el).getAttribute('aria-description')).toBe('Helpful text');
});

test('drops the description when there is no content', async () => {
  const el = await mount(`<pf-tooltip><button>Trigger</button></pf-tooltip>`);

  expect(trigger(el).hasAttribute('aria-description')).toBe(false);
});

test('updates the description when the content changes', async () => {
  const el = await mount(FIXTURE());
  const content = el.querySelector('[slot="content"]') as HTMLElement;

  content.textContent = 'Changed';
  await until(() => trigger(el).getAttribute('aria-description') === 'Changed');
});

test('opens on hover after the delay, and not before it', async () => {
  const el = await mount(FIXTURE('delay="80"'));

  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  expect(isOpen(el)).toBe(false);

  await until(() => isOpen(el), 'the tooltip to open');
});

test('closes again on pointerleave', async () => {
  const el = await mount(FIXTURE('delay="0"'));

  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  await until(() => isOpen(el));

  el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
  await until(() => !isOpen(el));
});

/* Keyboard users get the tooltip too, which is why it listens for focus. */
test('opens on focus and closes on blur', async () => {
  const el = await mount(FIXTURE('delay="0"'));

  trigger(el).focus();
  await until(() => isOpen(el));

  trigger(el).blur();
  await until(() => !isOpen(el));
});

test('a pointerleave before the delay elapses cancels the open', async () => {
  const el = await mount(FIXTURE('delay="150"'));

  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 250));

  expect(isOpen(el)).toBe(false);
});

test('a disabled tooltip never opens', async () => {
  const el = await mount(FIXTURE('delay="0" disabled'));

  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  trigger(el).focus();
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(isOpen(el)).toBe(false);
});

test('open=true shows it without any interaction', async () => {
  const el = await mount(FIXTURE('open'));

  await until(() => isOpen(el));
});

/* Controlled means the consumer decides: hover must not override them. */
test('hover does nothing while open is controlled', async () => {
  const el = await mount(FIXTURE('delay="0"'));
  el.open = false;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(isOpen(el)).toBe(false);
});

/* WAI-ARIA requires Escape to dismiss a tooltip, controlled or not. */
test('Escape dismisses it even when controlled', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => isOpen(el));

  trigger(el).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  await until(() => !isOpen(el));
});

/*
 * The whole reason the panel is a popover: it has to escape an ancestor's
 * overflow and stacking context, which is what createPortal does for the React
 * component and what nothing inside a shadow root can otherwise do.
 */
test('escapes a clipping ancestor and outranks a high z-index sibling', async () => {
  document.body.innerHTML = `
    <div id="clip" style="overflow:hidden;width:60px;height:30px;position:relative;z-index:0">
      ${FIXTURE('open')}
    </div>
    <div id="rival" style="position:absolute;inset:0;z-index:999"></div>`;
  await customElements.whenDefined('pf-tooltip');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-tooltip') as Tooltip;
  await until(() => isOpen(el));

  const box = panel(el).getBoundingClientRect();
  // Wider than the 60px clip box, so it is not being clipped.
  expect(box.width).toBeGreaterThan(60);

  /*
   * Hit-test the panel's own centre. The winner is the slotted content span
   * rather than the host, because slotted light-DOM content is returned
   * directly where shadow content retargets — either way it must not be the
   * z-index:999 rival, and it must be inside this tooltip.
   */
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  expect(hit?.id).not.toBe('rival');
  expect(el.contains(hit) || hit === el).toBe(true);
});

test('places itself on the requested side when there is room', async () => {
  document.body.innerHTML = `
    <div style="position:fixed;left:300px;top:300px">${FIXTURE('open placement="bottom"')}</div>`;
  await customElements.whenDefined('pf-tooltip');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-tooltip') as Tooltip;
  await until(() => isOpen(el) && panel(el).dataset.side === 'bottom');

  const anchor = trigger(el).getBoundingClientRect();
  expect(panel(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(anchor.bottom);
});

/* The side is recomputed from real rects, so a cramped anchor flips it. */
test('flips away from an edge it cannot fit against', async () => {
  document.body.innerHTML = `
    <div style="position:fixed;left:300px;top:0">${FIXTURE('open placement="top"')}</div>`;
  await customElements.whenDefined('pf-tooltip');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-tooltip') as Tooltip;
  await until(() => isOpen(el));
  await until(() => panel(el).dataset.side !== 'top', 'the tooltip to flip off the top edge');

  expect(panel(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
});

test('keeps itself placed across a scroll', async () => {
  document.body.innerHTML = `
    <div style="height:200vh;padding-top:400px">${FIXTURE('open')}</div>`;
  await customElements.whenDefined('pf-tooltip');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-tooltip') as Tooltip;
  await until(() => isOpen(el));

  /*
   * The panel follows the anchor, so the distance between them is what stays
   * constant — not either one's absolute position. Measured as the gap on
   * whichever axis the panel ended up on, and polled rather than sampled after
   * a fixed number of frames: the reposition runs on the scroll event, which
   * lands after the scroll itself.
   */
  const gap = () => {
    const a = trigger(el).getBoundingClientRect();
    const t = panel(el).getBoundingClientRect();
    return Math.round(
      Math.min(
        Math.abs(a.top - t.bottom),
        Math.abs(t.top - a.bottom),
        Math.abs(a.left - t.right),
        Math.abs(t.left - a.right),
      ),
    );
  };
  const before = gap();

  window.scrollBy(0, 120);
  await until(() => Math.abs(gap() - before) <= 1, 'the tooltip to follow the scroll');
});

/*
 * The one assertion that distinguishes a positioned popover from a centred
 * one: the box lands where the inline `left`/`top` say it should. The UA
 * stylesheet gives `[popover]` `inset: 0; margin: auto`, under which those two
 * declarations are offsets applied to a *centred* box, so the panel can sit
 * hundreds of pixels from the coordinate the observer computed while every
 * placement assertion above still passes -- `top >= anchor.bottom` is true of
 * a viewport-centred panel whose trigger is near the top. See
 * `src/place-popover.ts`.
 */
test('the box lands at the coordinates it was given', async () => {
  const el = await mount(
    `<div style="position:fixed;left:300px;top:300px">${FIXTURE('open')}</div>`,
  );
  await until(() => isOpen(el) && panel(el).style.top !== '');

  const requested = {
    left: Math.round(parseFloat(panel(el).style.left)),
    top: Math.round(parseFloat(panel(el).style.top)),
  };
  const box = panel(el).getBoundingClientRect();

  expect(Math.round(box.left)).toBe(requested.left);
  expect(Math.round(box.top)).toBe(requested.top);
});
