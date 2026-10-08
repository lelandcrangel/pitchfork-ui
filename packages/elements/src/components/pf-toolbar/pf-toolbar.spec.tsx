import { describe, expect, it, render } from '@stencil/vitest';
import './pf-toolbar';
import '../pf-toolbar-separator/pf-toolbar-separator';

const tabIndexes = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('button')).map((button) => button.tabIndex);

describe('pf-toolbar', () => {
  it('announces itself as a toolbar on the stated axis', async () => {
    const { root } = await render(`<pf-toolbar><button>a</button></pf-toolbar>`);

    expect(root.getAttribute('role')).toBe('toolbar');
    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
    expect(root.getAttribute('orientation')).toBe('horizontal');
  });

  it('announces a vertical toolbar when asked', async () => {
    const { root } = await render(
      `<pf-toolbar orientation="vertical"><button>a</button></pf-toolbar>`,
    );

    expect(root.getAttribute('aria-orientation')).toBe('vertical');
  });

  /*
   * One tab stop from the outside: the group is reached with a single Tab, and
   * the arrows move within it. Without this every button would be its own tab
   * stop, which is the failure mode the roving pattern exists to avoid.
   */
  it('leaves exactly one of its items tabbable', async () => {
    const { root } = await render(
      `<pf-toolbar><button>a</button><button>b</button><button>c</button></pf-toolbar>`,
    );

    expect(tabIndexes(root)).toEqual([0, -1, -1]);
  });

  it('respects a tab stop the markup already established', async () => {
    const { root } = await render(
      `<pf-toolbar><button>a</button><button tabindex="0">b</button></pf-toolbar>`,
    );

    expect(tabIndexes(root)).toEqual([-1, 0]);
  });

  /*
   * A separator cannot read its toolbar's orientation across the shadow
   * boundary -- `:host-context()` is the only selector that could, and Firefox
   * and Safari do not support it. The toolbar pushes the value down instead.
   */
  it('pushes its orientation onto every separator it contains', async () => {
    const { root } = await render(
      `<pf-toolbar orientation="vertical"><button>a</button><pf-toolbar-separator></pf-toolbar-separator><button>b</button></pf-toolbar>`,
    );

    expect(root.querySelector('pf-toolbar-separator')?.getAttribute('orientation')).toBe(
      'vertical',
    );
  });

  it('overrides a separator pointing the wrong way', async () => {
    const { root } = await render(
      `<pf-toolbar orientation="vertical"><pf-toolbar-separator orientation="horizontal"></pf-toolbar-separator></pf-toolbar>`,
    );

    expect(root.querySelector('pf-toolbar-separator')?.getAttribute('orientation')).toBe(
      'vertical',
    );
  });
});
