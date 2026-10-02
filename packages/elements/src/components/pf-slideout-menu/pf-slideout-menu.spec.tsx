/**
 * The markup and reflected props, which the fast project can see. Everything
 * involving `showModal()`, focus, the scroll lock or `slotchange` is in the
 * browser spec — the mock DOM has none of them.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-slideout-menu';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) ?? null;

describe('pf-slideout-menu', () => {
  it('renders a native dialog, closed', async () => {
    const { root } = await render(`<pf-slideout-menu></pf-slideout-menu>`);

    const dialog = part(root, 'dialog') as HTMLDialogElement;
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('defaults to the right edge at the medium width', async () => {
    const { root } = await render(`<pf-slideout-menu></pf-slideout-menu>`);

    expect(root.getAttribute('placement')).toBe('right');
    expect(root.getAttribute('size')).toBe('md');
  });

  it('renders a heading and description into its own shadow root', async () => {
    const { root } = await render(
      `<pf-slideout-menu heading="Filters" description="Narrow the list"></pf-slideout-menu>`,
    );

    expect(part(root, 'title')?.textContent).toBe('Filters');
    expect(part(root, 'description')?.textContent).toBe('Narrow the list');
  });

  it('has a close button unless asked not to', async () => {
    const { root } = await render(`<pf-slideout-menu heading="Filters"></pf-slideout-menu>`);
    expect(part(root, 'close')).not.toBeNull();

    const bare = await render(
      `<pf-slideout-menu heading="Filters" show-close-button="false"></pf-slideout-menu>`,
    );
    expect(part(bare.root, 'close')).toBeNull();
  });

  /*
   * With nothing to put in it — no heading, no description, no close button —
   * the header carries a border and padding and nothing else, so it goes.
   */
  it('omits the header when it would be empty', async () => {
    const { root } = await render(
      `<pf-slideout-menu label="Bare" show-close-button="false"></pf-slideout-menu>`,
    );
    expect(part(root, 'header')).toBeNull();
  });

  /*
   * Read in componentWillLoad as well as on slotchange, so the first paint is
   * right: the mock DOM never fires slotchange, and this assertion is only
   * meaningful because of that.
   */
  it('shows a footer slotted in before first paint', async () => {
    const { root } = await render(
      `<pf-slideout-menu><p>Body</p><button slot="footer">Apply</button></pf-slideout-menu>`,
    );
    expect(part(root, 'footer')?.hasAttribute('hidden')).toBe(false);
  });

  it('hides the footer when nothing is slotted into it', async () => {
    const { root } = await render(`<pf-slideout-menu><p>Body</p></pf-slideout-menu>`);
    expect(part(root, 'footer')?.hasAttribute('hidden')).toBe(true);
  });
});
