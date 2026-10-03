/**
 * The markup, the role mapping and the slot handling. The dismiss waits on a
 * real animation, so it is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-alert';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-alert', () => {
  it('is an informational status by default', async () => {
    const { root } = await render('<pf-alert heading="Saved"></pf-alert>');

    expect(root.getAttribute('variant')).toBe('info');
    expect(part(root, 'alert')?.getAttribute('role')).toBe('status');
    expect(part(root, 'title')?.textContent).toBe('Saved');
  });

  /*
   * `role="alert"` interrupts a screen reader, so only `warning` and `danger`
   * get it. The React `Alert` was `role="status"` for all four until the rule
   * moved to core, which is why both layers read it from there now.
   */
  it('announces a warning and a danger assertively', async () => {
    for (const variant of ['warning', 'danger']) {
      const { root } = await render(`<pf-alert variant="${variant}">Careful</pf-alert>`);
      expect(part(root, 'alert')?.getAttribute('role')).toBe('alert');
    }

    for (const variant of ['info', 'success']) {
      const { root } = await render(`<pf-alert variant="${variant}">Fine</pf-alert>`);
      expect(part(root, 'alert')?.getAttribute('role')).toBe('status');
    }
  });

  it('reflects its variant for the stylesheet', async () => {
    const { root } = await render('<pf-alert variant="danger">Bad</pf-alert>');
    expect(root.getAttribute('variant')).toBe('danger');
  });

  it('picks the icon its variant calls for', async () => {
    const { root } = await render('<pf-alert variant="success">Done</pf-alert>');
    const icon = part(root, 'icon')?.querySelector('pf-icon');

    expect(icon?.getAttribute('name')).toBe('circle-check');
  });

  it('offers the icon as a slot, with the variant’s as a fallback', async () => {
    const warning = await render('<pf-alert variant="warning">Careful</pf-alert>');
    const danger = await render('<pf-alert variant="danger">Bad</pf-alert>');

    const iconIn = (root: HTMLElement) =>
      part(root, 'icon')
        ?.querySelector('slot[name="icon"]')
        ?.querySelector('pf-icon')
        ?.getAttribute('name');

    expect(part(warning.root, 'icon')?.querySelector('slot[name="icon"]')).toBeTruthy();
    expect(iconIn(warning.root)).toBe('triangle-exclamation');
    expect(iconIn(danger.root)).toBe('circle-xmark');
  });

  it('shows the description when it has one', async () => {
    const { root } = await render('<pf-alert description="All good."></pf-alert>');

    expect(part(root, 'body')?.className).not.toContain('empty');
    expect(part(root, 'body')?.querySelector('slot')?.textContent).toContain('All good.');
  });

  it('collapses the body box when there is nothing in it', async () => {
    const { root } = await render('<pf-alert heading="Only a heading"></pf-alert>');

    expect(part(root, 'body')?.className).toContain('empty');
    // The slot stays rendered, or content added later never shows.
    expect(part(root, 'body')?.querySelector('slot')).toBeTruthy();
  });

  it('prefers a slotted body over the description prop', async () => {
    const { root } = await render('<pf-alert description="Ignored">Slotted</pf-alert>');
    expect(part(root, 'body')?.className).not.toContain('empty');
  });

  it('has no dismiss button unless asked', async () => {
    const { root } = await render('<pf-alert heading="Saved"></pf-alert>');
    expect(part(root, 'dismiss')).toBeNull();
  });

  it('names its dismiss button, and takes a name of its own', async () => {
    const plain = await render('<pf-alert dismissible>Note</pf-alert>');
    const named = await render('<pf-alert dismissible dismiss-label="Close">Note</pf-alert>');

    expect(part(plain.root, 'dismiss')?.getAttribute('aria-label')).toBe('Dismiss alert');
    expect(part(named.root, 'dismiss')?.getAttribute('aria-label')).toBe('Close');
  });

  it('marks itself as leaving while it is', async () => {
    const { root, waitForChanges } = await render('<pf-alert dismissible>Note</pf-alert>');

    await (root as HTMLElement & { dismiss(): Promise<void> }).dismiss();
    await waitForChanges();

    expect(part(root, 'alert')?.className).toContain('alert--exiting');
  });

  it('reports the dismiss once', async () => {
    const { root, waitForChanges } = await render('<pf-alert dismissible>Note</pf-alert>');
    let heard = 0;
    root.addEventListener('pfDismiss', () => {
      heard += 1;
    });

    const node = root as HTMLElement & { dismiss(): Promise<void> };
    await node.dismiss();
    await node.dismiss();
    await waitForChanges();

    expect(heard).toBe(1);
  });
});
