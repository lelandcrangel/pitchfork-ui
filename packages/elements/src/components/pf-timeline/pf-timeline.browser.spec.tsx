/**
 * What the fast project cannot see: `slotchange`, which it never fires, and
 * the boxes the slots do or do not generate, which needs layout.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-timeline';
import '../pf-timeline-item/pf-timeline-item';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = `
  <pf-timeline>
    <pf-timeline-item tone="success">
      <span slot="title">Deployed</span>
      <span slot="timestamp">2 hours ago</span>
      <span slot="description">Version 1.4.0 went out.</span>
      <span slot="icon">✓</span>
    </pf-timeline-item>
    <pf-timeline-item><span slot="title">Opened</span></pf-timeline-item>
  </pf-timeline>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-timeline');
  await customElements.whenDefined('pf-timeline-item');
  await frame();
  await frame();
  return document.querySelector('pf-timeline') as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'pf-timeline') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const slotOf = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`slot[name="${name}"]`) as HTMLSlotElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/* The entry that was last stops being last, so it grows a connector. */
test('re-reads the timeline when an entry is appended', async () => {
  const el = await mount(FIXTURE);
  const opened = el.querySelectorAll('pf-timeline-item')[1];
  expect(part(opened, 'connector')).toBeNull();

  const added = document.createElement('pf-timeline-item');
  added.innerHTML = '<span slot="title">Drafted</span>';
  el.append(added);

  await until(() => Boolean(part(opened, 'connector')), 'the connector appearing');
  expect(opened.hasAttribute('last')).toBe(false);
  expect(added.hasAttribute('last')).toBe(true);
});

test('re-reads the timeline when the last entry is removed', async () => {
  const el = await mount(FIXTURE);
  const [deployed, opened] = Array.from(el.querySelectorAll('pf-timeline-item'));

  opened.remove();
  await until(() => deployed.hasAttribute('last'), 'the timeline shortening');
  expect(part(deployed, 'connector')).toBeNull();
});

/*
 * The icon slot stays in the tree with nothing in it, because a slot that is
 * not rendered never fires `slotchange` — so an icon added later would stay
 * invisible for good. This is that case: the marker has to grow when one
 * arrives.
 */
test('notices an icon slotted in after mount', async () => {
  const el = await mount(FIXTURE);
  const opened = el.querySelectorAll('pf-timeline-item')[1];
  expect(part(opened, 'marker')?.classList.contains('with-icon')).toBe(false);

  const icon = document.createElement('span');
  icon.slot = 'icon';
  icon.textContent = '!';
  opened.append(icon);

  await until(
    () => part(opened, 'marker')?.classList.contains('with-icon') === true,
    'the marker growing',
  );
});

/*
 * No wrapper around the timestamp or the description: a box around a slot
 * cannot be collapsed from CSS, while an unassigned slot generates nothing at
 * all — measured here as a zero box.
 */
test('an entry with no timestamp or description generates no box for them', async () => {
  const el = await mount(FIXTURE);
  const [deployed, opened] = Array.from(el.querySelectorAll('pf-timeline-item'));

  for (const name of ['timestamp', 'description']) {
    expect(slotOf(opened, name).assignedElements()).toEqual([]);
    expect(slotOf(opened, name).getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(slotOf(opened, name)).display).toBe('contents');

    expect(slotOf(deployed, name).assignedElements()).toHaveLength(1);
  }
});

/* The entries have to be grid items of the host, not of a box inside it. */
test('the entries are laid out by the timeline itself', async () => {
  const el = await mount(FIXTURE);
  const slot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;

  expect(getComputedStyle(slot).display).toBe('contents');
  expect(slot.assignedElements()).toHaveLength(2);
});
