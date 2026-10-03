/**
 * The markup the fast project can see. Everything involving `showModal()`,
 * focus, the scroll lock, `slotchange` or ARIA element reflection is in the
 * browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-command-palette';
import '../pf-command-group/pf-command-group';
import '../pf-command-item/pf-command-item';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) ?? null;

describe('pf-command-palette', () => {
  it('renders a native dialog, closed', async () => {
    const { root } = await render(`<pf-command-palette></pf-command-palette>`);

    const dialog = part(root, 'dialog') as HTMLDialogElement;
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('names the dialog and its listbox', async () => {
    const { root } = await render(`<pf-command-palette label="Jump to"></pf-command-palette>`);

    expect(part(root, 'dialog')?.getAttribute('aria-label')).toBe('Jump to');
    expect(part(root, 'list')?.getAttribute('aria-label')).toBe('Jump to');
  });

  it('wires the input as a combobox over the listbox', async () => {
    const { root } = await render(`<pf-command-palette></pf-command-palette>`);

    const input = part(root, 'input') as HTMLInputElement;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(part(root, 'list')?.getAttribute('role')).toBe('listbox');
  });

  it('takes its placeholder from the prop', async () => {
    const { root } = await render(
      `<pf-command-palette placeholder="Type a command"></pf-command-palette>`,
    );
    expect((part(root, 'input') as HTMLInputElement).placeholder).toBe('Type a command');
  });

  /* With no children there is nothing to match, so the message stands in. */
  it('shows the empty message when it has no commands', async () => {
    const { root } = await render(
      `<pf-command-palette empty-message="Nothing here"></pf-command-palette>`,
    );
    expect(part(root, 'empty')?.textContent).toBe('Nothing here');
  });

  it('hides the empty message once it has a command', async () => {
    const { root } = await render(
      `<pf-command-palette><pf-command-item value="a">Alpha</pf-command-item></pf-command-palette>`,
    );
    expect(part(root, 'empty')).toBeNull();
  });
});

describe('pf-command-item', () => {
  it('announces itself as an option', async () => {
    const { root } = await render(`<pf-command-item value="a">Alpha</pf-command-item>`);
    expect(root.getAttribute('role')).toBe('option');
  });

  it('renders a description when given one', async () => {
    const { root } = await render(
      `<pf-command-item value="a" description="Supporting line">Alpha</pf-command-item>`,
    );
    expect(root.shadowRoot?.querySelector('[part="description"]')?.textContent).toBe(
      'Supporting line',
    );
  });

  it('omits the description box when there is none', async () => {
    const { root } = await render(`<pf-command-item value="a">Alpha</pf-command-item>`);
    expect(root.shadowRoot?.querySelector('[part="description"]')).toBeNull();
  });

  it('reflects disabled, and says so to a screen reader', async () => {
    const { root } = await render(`<pf-command-item value="a" disabled>Alpha</pf-command-item>`);
    expect(root.getAttribute('disabled')).not.toBeNull();
    expect(root.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not claim to be disabled when it is not', async () => {
    const { root } = await render(`<pf-command-item value="a">Alpha</pf-command-item>`);
    expect(root.getAttribute('aria-disabled')).toBeNull();
  });
});

describe('pf-command-group', () => {
  it('is a labelled group', async () => {
    const { root } = await render(`<pf-command-group label="File"></pf-command-group>`);

    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('File');
    expect(root.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('File');
  });

  it('renders no heading without a label', async () => {
    const { root } = await render(`<pf-command-group></pf-command-group>`);
    expect(root.shadowRoot?.querySelector('[part="label"]')).toBeNull();
  });
});
