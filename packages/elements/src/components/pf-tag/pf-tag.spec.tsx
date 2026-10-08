import { describe, expect, it, render, vi } from '@stencil/vitest';
import './pf-tag';

describe('pf-tag', () => {
  it('renders its label in a part', async () => {
    const { root } = await render(`<pf-tag>Design</pf-tag>`);

    expect(root.shadowRoot?.querySelector('[part="label"]')).not.toBeNull();
    expect(root.textContent).toBe('Design');
  });

  it('has no remove button unless dismissible', async () => {
    const { root } = await render(`<pf-tag>Design</pf-tag>`);

    expect(root.shadowRoot?.querySelector('[part="dismiss"]')).toBeNull();
  });

  it('gives the remove button an accessible name', async () => {
    const { root } = await render(`<pf-tag dismissible>Design</pf-tag>`);

    expect(root.shadowRoot?.querySelector('[part="dismiss"]')?.getAttribute('aria-label')).toBe(
      'Remove tag',
    );
  });

  it('takes a custom name for the remove button', async () => {
    const { root } = await render(`<pf-tag dismissible dismiss-label="Remove Design"></pf-tag>`);

    expect(root.shadowRoot?.querySelector('[part="dismiss"]')?.getAttribute('aria-label')).toBe(
      'Remove Design',
    );
  });

  it('emits pfDismiss rather than removing itself', async () => {
    const { root } = await render(`<pf-tag dismissible>Design</pf-tag>`);
    const onDismiss = vi.fn();
    root.addEventListener('pfDismiss', onDismiss);

    root.shadowRoot?.querySelector<HTMLButtonElement>('[part="dismiss"]')?.click();

    expect(onDismiss).toHaveBeenCalledOnce();
    // Still in the document: whoever owns the list decides.
    expect(root.isConnected).toBe(true);
  });
});
