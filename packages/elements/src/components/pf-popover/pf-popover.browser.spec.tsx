/**
 * pf-popover is tested in a real browser, all of it.
 *
 * The panel is a `popover`, which the mock DOM does not implement, and the
 * anchoring reads real rects. Light-dismiss needs *trusted* input: a synthetic
 * `.click()` or `dispatchEvent(new KeyboardEvent(...))` does not trigger it —
 * measured — so those assertions go through `userEvent`, which drives the
 * browser itself.
 */
import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import './pf-popover';

type Popover = HTMLElement & {
  open: boolean;
  dismissable: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-popover');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-popover') as Popover;
};

const until = async (predicate: () => boolean, label = 'pf-popover') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const panel = (el: Popover) => el.shadowRoot?.querySelector('[part="panel"]') as HTMLElement;
const isOpen = (el: Popover) => panel(el).matches(':popover-open');
const trigger = (el: Popover) => el.firstElementChild as HTMLElement;

const FIXTURE = (attrs = '') => `
  <div style="padding:120px">
    <pf-popover ${attrs} label="Settings">
      <button type="button">Open</button>
      <div slot="content"><button type="button" id="inside">Inside</button></div>
    </pf-popover>
  </div>
  <button type="button" id="elsewhere">Elsewhere</button>`;

test('the panel is a dialog-roled popover, closed to begin with', async () => {
  const el = await mount(FIXTURE());

  expect(panel(el).getAttribute('role')).toBe('dialog');
  expect(panel(el).getAttribute('aria-label')).toBe('Settings');
  expect(isOpen(el)).toBe(false);
});

/*
 * `aria-controls` is absent on purpose: it is an IDREF, and an IDREF does not
 * cross a shadow boundary, so pointing it at the panel would leave a dangling
 * reference. `aria-expanded` is what a screen reader announces here.
 */
test('marks the trigger as a disclosure, without a dangling aria-controls', async () => {
  const el = await mount(FIXTURE());

  expect(trigger(el).getAttribute('aria-haspopup')).toBe('dialog');
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  expect(trigger(el).hasAttribute('aria-controls')).toBe(false);
});

test('the trigger toggles it, and aria-expanded follows', async () => {
  const el = await mount(FIXTURE());

  await userEvent.click(trigger(el));
  await until(() => isOpen(el));
  expect(trigger(el).getAttribute('aria-expanded')).toBe('true');

  await userEvent.click(trigger(el));
  await until(() => !isOpen(el));
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
});

test('reports every state change through pfOpenChange', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (e) =>
    seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
  );

  await userEvent.click(trigger(el));
  await until(() => isOpen(el));
  await userEvent.click(trigger(el));
  await until(() => !isOpen(el));

  expect(seen).toEqual([true, false]);
});

test('show() and hide() drive it from script', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => isOpen(el));
  await el.hide();
  await until(() => !isOpen(el));
});

/*
 * The reason the panel is `auto`: the browser does light-dismiss itself, so
 * there is no outside-click listener here to get wrong. Needs real input.
 */
test('a real outside click dismisses it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere') as HTMLElement);
  await until(() => !isOpen(el), 'the popover to light-dismiss');
});

test('a real Escape dismisses it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'the popover to close on Escape');
});

/* A browser dismiss has to reach the consumer, or their `open` goes stale. */
test('mirrors a browser dismiss back into open and pfOpenChange', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (e) =>
    seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
  );

  await el.show();
  await until(() => isOpen(el));
  await userEvent.keyboard('{Escape}');
  await until(() => el.open === false);

  expect(seen.at(-1)).toBe(false);
});

/* dismissable=false means `manual`, where the browser does neither. */
test('a non-dismissable popover survives an outside click', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere') as HTMLElement);
  await new Promise((resolve) => setTimeout(resolve, 120));

  expect(isOpen(el)).toBe(true);
  expect(panel(el).getAttribute('popover')).toBe('manual');
});

/* But Escape still closes it — handled here, because `manual` gets no help. */
test('a non-dismissable popover still closes on Escape', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => isOpen(el));

  panel(el).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  await until(() => !isOpen(el));
});

test('a click inside the panel does not toggle it shut', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('inside') as HTMLElement);
  await new Promise((resolve) => setTimeout(resolve, 120));

  expect(isOpen(el)).toBe(true);
});

/* The panel is a dialog, so focus belongs in it once it is showing. */
test('moves focus into the panel on open', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => isOpen(el));

  expect(el.shadowRoot?.activeElement).toBe(panel(el));
});

test('escapes a clipping ancestor and outranks a high z-index sibling', async () => {
  document.body.innerHTML = `
    <div id="clip" style="overflow:hidden;width:60px;height:30px;position:relative;z-index:0">
      <pf-popover label="x"><button type="button">Open</button>
        <div slot="content">Wide enough to prove it is not clipped</div>
      </pf-popover>
    </div>
    <div id="rival" style="position:absolute;inset:0;z-index:999"></div>`;
  await customElements.whenDefined('pf-popover');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-popover') as Popover;

  await el.show();
  await until(() => isOpen(el));

  const box = panel(el).getBoundingClientRect();
  expect(box.width).toBeGreaterThan(60);
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  expect(hit?.id).not.toBe('rival');
});

test('anchors below the trigger when there is room', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el) && panel(el).style.top !== '');

  const anchor = trigger(el).getBoundingClientRect();
  expect(panel(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(anchor.bottom);
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
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el) && panel(el).style.top !== '');

  const requested = {
    left: Math.round(parseFloat(panel(el).style.left)),
    top: Math.round(parseFloat(panel(el).style.top)),
  };
  const box = panel(el).getBoundingClientRect();

  expect(Math.round(box.left)).toBe(requested.left);
  expect(Math.round(box.top)).toBe(requested.top);
});
