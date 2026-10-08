/**
 * The markup and the tones. Dismissal waits on a real animation, so it is in
 * the browser spec — with the one assertion the fast project can make about
 * it: that it resolves at all when nothing animates.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-inline-cta';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const isEmpty = (root: HTMLElement, name: string) =>
  part(root, name)?.classList.contains('empty') ?? null;

describe('pf-inline-cta', () => {
  it('renders the heading, the icon and nothing else by default', async () => {
    const { root } = await render(`<pf-inline-cta>Finish setting up</pf-inline-cta>`);

    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('p');
    expect(part(root, 'icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(isEmpty(root, 'action')).toBe(true);
    expect(part(root, 'dismiss')).toBeNull();
  });

  it('renders the named icon, and lets a slotted one replace it', async () => {
    const { root: named } = await render(`<pf-inline-cta icon="circle-info">Hi</pf-inline-cta>`);
    expect(part(named, 'icon')?.querySelector('pf-icon')?.getAttribute('name')).toBe('circle-info');

    const { root: slotted } = await render(
      `<pf-inline-cta icon="circle-info"><img slot="icon" src="i.svg" alt="" />Hi</pf-inline-cta>`,
    );
    expect(part(slotted, 'icon')?.querySelector('pf-icon')).toBeNull();
  });

  it('draws the action box when something is slotted into it', async () => {
    const { root } = await render(`
      <pf-inline-cta>
        Finish setting up
        <button slot="action" type="button">Continue</button>
      </pf-inline-cta>`);

    expect(isEmpty(root, 'action')).toBe(false);
  });

  it('gives the description no wrapper', async () => {
    const { root } = await render(`
      <pf-inline-cta>
        Finish setting up
        <span slot="description">Two steps left.</span>
      </pf-inline-cta>`);

    expect(part(root, 'description')).toBeNull();
    expect(root.shadowRoot?.querySelector('slot[name="description"]')).not.toBeNull();
  });

  it('defaults to the default tone and takes the others', async () => {
    const { root: plain } = await render(`<pf-inline-cta>Hi</pf-inline-cta>`);
    expect(plain.getAttribute('tone')).toBe('default');

    const { root: danger } = await render(`<pf-inline-cta tone="danger">Hi</pf-inline-cta>`);
    expect(danger.getAttribute('tone')).toBe('danger');
  });

  it('offers a named dismiss button only when asked', async () => {
    const { root } = await render(
      `<pf-inline-cta dismissible dismiss-label="Hide this">Hi</pf-inline-cta>`,
    );

    expect(part(root, 'dismiss')?.getAttribute('aria-label')).toBe('Hide this');
  });

  /*
   * The whole reason this waits on `getAnimations()` rather than a timeout:
   * with no stylesheet — which is every test in this project, and a consumer
   * who has not loaded the CSS — nothing animates, and the promise still has
   * to resolve. A timeout would also "work" here, four frames late.
   */
  it('resolves its dismissal when nothing animates', async () => {
    const { root, waitForChanges } = await render(`<pf-inline-cta dismissible>Hi</pf-inline-cta>`);
    const dismissed: string[] = [];
    root.addEventListener('pfDismiss', () => dismissed.push('gone'));

    await (root as HTMLElement & { dismiss(): Promise<void> }).dismiss();
    await waitForChanges();

    expect(root.hasAttribute('exiting')).toBe(true);
    expect(dismissed).toEqual(['gone']);
  });

  it('ignores a second dismissal while one is running', async () => {
    const { root, waitForChanges } = await render(`<pf-inline-cta dismissible>Hi</pf-inline-cta>`);
    const el = root as HTMLElement & { dismiss(): Promise<void> };
    const dismissed: string[] = [];
    root.addEventListener('pfDismiss', () => dismissed.push('gone'));

    await Promise.all([el.dismiss(), el.dismiss()]);
    await waitForChanges();

    expect(dismissed).toEqual(['gone']);
  });
});
