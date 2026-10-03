/**
 * What the fast project cannot see: `slotchange`, which it never fires, and
 * the boxes the slots do or do not generate, which needs layout.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-progress-steps';
import '../pf-progress-step/pf-progress-step';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = `
  <pf-progress-steps>
    <pf-progress-step><span slot="title">Account</span></pf-progress-step>
    <pf-progress-step>
      <span slot="title">Details</span>
      <span slot="description">Fill in your details.</span>
    </pf-progress-step>
  </pf-progress-steps>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-progress-steps');
  await customElements.whenDefined('pf-progress-step');
  await frame();
  await frame();
  return document.querySelector('pf-progress-steps') as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'pf-progress-steps') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The step that was last stops being last, so it grows a connector — and the
 * new one has to be numbered. Both are the group's to do, which is why it has
 * to be told when the trail changes.
 */
test('re-reads the trail when a step is appended', async () => {
  const el = await mount(FIXTURE);
  const details = el.querySelectorAll('pf-progress-step')[1];
  expect(part(details, 'connector')).toBeNull();

  const added = document.createElement('pf-progress-step');
  added.innerHTML = '<span slot="title">Confirm</span>';
  el.append(added);

  await until(() => Boolean(part(details, 'connector')), 'the connector appearing');
  await until(() => part(added, 'marker')?.textContent === '3', 'the new step being numbered');
  expect(added.getAttribute('state')).toBe('upcoming');
});

test('renumbers when a step is removed', async () => {
  const el = await mount(FIXTURE);
  const [account, details] = Array.from(el.querySelectorAll('pf-progress-step'));

  account.remove();
  await until(() => part(details, 'marker')?.textContent === '1', 'the renumbering');
  expect(details.getAttribute('state')).toBe('current');
  expect(part(details, 'connector')).toBeNull();
});

/*
 * The description has no wrapper, deliberately: a box around a slot cannot be
 * collapsed from CSS, so an empty one would leave its margin under every step
 * without a description. An *unassigned* slot generates nothing at all —
 * measured here, as a zero box and a computed `display: contents`.
 */
test('a step with no description generates no box for one', async () => {
  const el = await mount(FIXTURE);
  const [account, details] = Array.from(el.querySelectorAll('pf-progress-step'));

  const slotOf = (step: Element) =>
    step.shadowRoot?.querySelector('slot[name="description"]') as HTMLSlotElement;

  expect(slotOf(account).assignedElements()).toEqual([]);
  expect(slotOf(account).getBoundingClientRect().height).toBe(0);
  expect(getComputedStyle(slotOf(account)).display).toBe('contents');

  // The one that does have a description lays it out.
  expect(slotOf(details).assignedElements()).toHaveLength(1);
  expect(
    (slotOf(details).assignedElements()[0] as HTMLElement).getBoundingClientRect().height,
  ).toBeGreaterThan(0);
});

/* The steps have to be grid items of the host, not of a box inside it. */
test('the steps are laid out by the indicator itself', async () => {
  const el = await mount(FIXTURE);
  const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;

  expect(getComputedStyle(slot).display).toBe('contents');
  expect(slot.assignedElements()).toHaveLength(2);
});
