/**
 * The markup and the pushed-down state. The overlap, the ring and the
 * collapsing itself are CSS, so they are asserted against a real build in
 * `scripts/smoke-consumer.mjs`; `slotchange` is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-avatar-group';
import '../pf-avatar/pf-avatar';

const FIXTURE = (attrs = '', count = 4) => `
  <pf-avatar-group ${attrs}>
    ${Array.from({ length: count }, (_, index) => `<pf-avatar name="Person ${index + 1}"></pf-avatar>`).join('\n    ')}
  </pf-avatar-group>`;

const avatars = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-avatar'));
const shown = (root: HTMLElement) =>
  avatars(root).filter((avatar) => !avatar.hasAttribute('data-pf-overflow'));
const chip = (root: HTMLElement) =>
  root.shadowRoot?.querySelector('[part="overflow"]') as HTMLElement | null;

describe('pf-avatar-group', () => {
  it('is a named group of people', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('4 people');
  });

  it('counts one person as a person', async () => {
    const { root } = await render(FIXTURE('', 1));
    expect(root.getAttribute('aria-label')).toBe('1 person');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(FIXTURE('label="The design team"'));
    expect(root.getAttribute('aria-label')).toBe('The design team');
  });

  it('shows every avatar when they fit, with no chip', async () => {
    const { root } = await render(FIXTURE('max="5"'));

    expect(shown(root)).toHaveLength(4);
    expect(chip(root)).toBeNull();
  });

  /*
   * A data attribute of the group's own, not `hidden`: `hidden` is the
   * consumer's to set, and overwriting it would lose an avatar they had hidden
   * themselves.
   */
  it('collapses the ones past the maximum, and counts them', async () => {
    const { root } = await render(FIXTURE('max="2"'));

    expect(shown(root)).toHaveLength(2);
    expect(avatars(root)[3].hasAttribute('data-pf-overflow')).toBe(true);
    expect(avatars(root).some((avatar) => avatar.hasAttribute('hidden'))).toBe(false);
    expect(chip(root)?.textContent).toBe('+2');
  });

  /*
   * The chip is an avatar of its own, so it has the shape and the name. Read
   * as a property: `name` is unreflected, and this spec imports `pf-avatar`,
   * so Stencil set the prop and left no attribute behind.
   */
  it('names the chip for a screen reader', async () => {
    const { root } = await render(FIXTURE('max="2"'));

    expect(chip(root)?.tagName.toLowerCase()).toBe('pf-avatar');
    expect((chip(root) as HTMLElement & { name?: string })?.name).toBe('2 more');
    expect(chip(root)?.getAttribute('aria-label')).toBe('2 more');
  });

  /* The group may know its size without an avatar for every member. */
  it('counts up to an explicit total', async () => {
    const { root } = await render(FIXTURE('max="4" total="40"'));

    expect(shown(root)).toHaveLength(4);
    expect(chip(root)?.textContent).toBe('+36');
    expect(root.getAttribute('aria-label')).toBe('40 people');
  });

  it('pushes its size down onto every avatar, chip included', async () => {
    const { root } = await render(FIXTURE('max="2" size="lg"'));

    expect(avatars(root).every((avatar) => avatar.getAttribute('size') === 'lg')).toBe(true);
    expect(chip(root)?.getAttribute('size')).toBe('lg');
  });

  /* Earlier avatars stack above later ones, so the overlap reads as a stack. */
  it('stacks the shown avatars front to back', async () => {
    const { root } = await render(FIXTURE('max="3"'));

    expect(avatars(root).map((avatar) => avatar.style.zIndex)).toEqual(['3', '2', '1', '']);
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('max="2"'));

    avatars(root)[3].remove();
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(chip(root)?.textContent).toBe('+1');
    expect(root.getAttribute('aria-label')).toBe('3 people');
  });

  it('leaves a nested group its own avatars', async () => {
    const { root } = await render(`
      <pf-avatar-group max="1" size="lg">
        <pf-avatar name="Outer"></pf-avatar>
        <div>
          <pf-avatar-group max="1">
            <pf-avatar name="Inner one"></pf-avatar>
            <pf-avatar name="Inner two"></pf-avatar>
          </pf-avatar-group>
        </div>
      </pf-avatar-group>`);

    // The outer group counts one avatar, not three, so it shows no chip.
    expect(chip(root)).toBeNull();
    expect(root.getAttribute('aria-label')).toBe('1 person');

    const inner = root.querySelector('pf-avatar-group') as HTMLElement;
    expect(chip(inner)?.textContent).toBe('+1');
    // And its size is its own: the outer group never reached it.
    expect(inner.querySelector('pf-avatar')?.getAttribute('size')).toBe('md');
  });
});
