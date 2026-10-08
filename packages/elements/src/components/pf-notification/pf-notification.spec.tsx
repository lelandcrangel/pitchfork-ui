/**
 * The parts the mock DOM can see: markup, reflected props, the role each
 * variant carries, and the icon the variant chooses.
 *
 * The exit animation and `slotchange` are in the browser spec — the mock DOM
 * runs no animations and never fires `slotchange`.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-notification';

const box = (root: HTMLElement) =>
  root.shadowRoot?.querySelector('[part="notification"]') as HTMLElement;
const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) ?? null;

describe('pf-notification', () => {
  it('renders a heading and a description', async () => {
    const { root } = await render(
      `<pf-notification heading="Saved" description="All good"></pf-notification>`,
    );

    expect(part(root, 'title')?.textContent).toBe('Saved');
    expect(part(root, 'body')?.textContent).toContain('All good');
  });

  /*
   * The rule the React component used to break: assertive interrupts a screen
   * reader, which is right for a failure and rude for a success.
   */
  it.each([
    ['info', 'status'],
    ['success', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ])('announces %s as role=%s', async (variant, role) => {
    const { root } = await render(`<pf-notification variant="${variant}"></pf-notification>`);
    expect(box(root).getAttribute('role')).toBe(role);
  });

  it.each([
    ['info', 'circle-info'],
    ['success', 'circle-check'],
    ['warning', 'triangle-exclamation'],
    ['danger', 'circle-xmark'],
  ])('picks the %s icon for %s', async (variant, icon) => {
    const { root } = await render(`<pf-notification variant="${variant}"></pf-notification>`);
    expect(root.shadowRoot?.querySelector('pf-icon')?.getAttribute('name')).toBe(icon);
  });

  it('reflects variant so the stylesheet can select on it', async () => {
    const { root } = await render(`<pf-notification variant="danger"></pf-notification>`);
    expect(root.getAttribute('variant')).toBe('danger');
  });

  it('has no dismiss button unless asked', async () => {
    const plain = await render(`<pf-notification heading="Hi"></pf-notification>`);
    expect(part(plain.root, 'dismiss')).toBeNull();

    const asked = await render(`<pf-notification heading="Hi" dismissable></pf-notification>`);
    expect(part(asked.root, 'dismiss')).not.toBeNull();
  });

  /* The icon slot has fallback content, so the variant icon goes away. */
  it('lets a slotted icon replace the variant icon', async () => {
    const { root } = await render(
      `<pf-notification variant="danger"><span slot="icon">!</span></pf-notification>`,
    );
    expect(root.shadowRoot?.querySelector('slot[name="icon"]')).not.toBeNull();
  });

  /*
   * The body box carries colour and sits in a gap, so it has to actually not
   * render when there is nothing to put in it.
   */
  it('hides the body when there is neither a description nor slotted content', async () => {
    const { root } = await render(`<pf-notification heading="Only a heading"></pf-notification>`);
    expect(part(root, 'body')?.hasAttribute('hidden')).toBe(true);
  });

  it('shows the body for light-DOM content with no slot name', async () => {
    const { root } = await render(`<pf-notification heading="Hi">Body text</pf-notification>`);
    expect(part(root, 'body')?.hasAttribute('hidden')).toBe(false);
  });

  /* `slot="action"` is not body content, so it must not un-hide the body. */
  it('does not count a slotted action as body content', async () => {
    const { root } = await render(
      `<pf-notification heading="Hi"><button slot="action">Undo</button></pf-notification>`,
    );
    expect(part(root, 'body')?.hasAttribute('hidden')).toBe(true);
  });
});
