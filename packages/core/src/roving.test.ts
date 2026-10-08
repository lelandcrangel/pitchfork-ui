import { beforeEach, describe, expect, it } from 'vitest';

import { getRovingItems, resolveRovingKey, syncRovingTabIndex } from './roving';

const mount = (html: string) => {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById('root') as HTMLElement;
};

const tabIndexes = (items: HTMLElement[]) => items.map((item) => item.tabIndex);

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('getRovingItems', () => {
  it('collects interactive descendants in source order', () => {
    const root = mount(`<button>a</button><a href="#x">b</a><input /><select></select>`);

    expect(getRovingItems(root).map((item) => item.tagName)).toEqual([
      'BUTTON',
      'A',
      'INPUT',
      'SELECT',
    ]);
  });

  it('skips disabled controls', () => {
    const root = mount(`<button>a</button><button disabled>b</button><input disabled />`);

    expect(getRovingItems(root)).toHaveLength(1);
  });

  /* An anchor without href is not focusable, so it is not a tab stop either. */
  it('skips an anchor with no href', () => {
    const root = mount(`<a>no href</a><a href="#x">href</a>`);

    expect(getRovingItems(root)).toHaveLength(1);
  });

  /*
   * A custom element is not a native control, so it opts in explicitly. This is
   * how a <pf-button> inside a toolbar joins the keyboard order.
   */
  it('includes an element that opts in with data-toolbar-item', () => {
    const root = mount(`<pf-button data-toolbar-item></pf-button>`);

    expect(getRovingItems(root)).toHaveLength(1);
  });

  it('excludes an opted-in element that says it is disabled', () => {
    const root = mount(`<pf-button data-toolbar-item aria-disabled="true"></pf-button>`);

    expect(getRovingItems(root)).toHaveLength(0);
  });

  it('finds items nested inside wrappers, not just direct children', () => {
    const root = mount(`<div><span><button>deep</button></span></div>`);

    expect(getRovingItems(root)).toHaveLength(1);
  });
});

describe('syncRovingTabIndex', () => {
  it('makes the first item the only tab stop when none is set', () => {
    const items = getRovingItems(mount(`<button>a</button><button>b</button><button>c</button>`));

    syncRovingTabIndex(items);

    expect(tabIndexes(items)).toEqual([0, -1, -1]);
  });

  /*
   * A native button reports tabIndex === 0 with no attribute, so reading the
   * property rather than the attribute would treat every button as an existing
   * tab stop and leave all of them tabbable.
   */
  it('reads the attribute, not the property, when looking for the current stop', () => {
    const items = getRovingItems(mount(`<button>a</button><button>b</button>`));

    expect(items.every((item) => item.tabIndex === 0)).toBe(true);
    expect(items.some((item) => item.hasAttribute('tabindex'))).toBe(false);

    syncRovingTabIndex(items);

    expect(tabIndexes(items)).toEqual([0, -1]);
  });

  it('keeps an established tab stop rather than resetting to the first', () => {
    const items = getRovingItems(
      mount(`<button>a</button><button tabindex="0">b</button><button>c</button>`),
    );

    syncRovingTabIndex(items);

    expect(tabIndexes(items)).toEqual([-1, 0, -1]);
  });

  it('moves the tab stop to a preferred item', () => {
    const items = getRovingItems(
      mount(`<button tabindex="0">a</button><button>b</button><button>c</button>`),
    );

    syncRovingTabIndex(items, items[2]);

    expect(tabIndexes(items)).toEqual([-1, -1, 0]);
  });

  it('ignores a preferred item that is not in the group', () => {
    const items = getRovingItems(mount(`<button>a</button><button>b</button>`));
    const outsider = document.createElement('button');

    syncRovingTabIndex(items, outsider);

    expect(tabIndexes(items)).toEqual([0, -1]);
  });

  it('is a no-op on an empty group', () => {
    expect(() => syncRovingTabIndex([])).not.toThrow();
  });

  it('is idempotent — running twice leaves the same single stop', () => {
    const items = getRovingItems(mount(`<button>a</button><button>b</button><button>c</button>`));

    syncRovingTabIndex(items, items[1]);
    syncRovingTabIndex(items);

    expect(tabIndexes(items)).toEqual([-1, 0, -1]);
  });
});

describe('resolveRovingKey', () => {
  it('moves on the horizontal axis for a horizontal group', () => {
    expect(resolveRovingKey('ArrowRight', 'horizontal')).toBe('next');
    expect(resolveRovingKey('ArrowLeft', 'horizontal')).toBe('previous');
  });

  it('moves on the vertical axis for a vertical group', () => {
    expect(resolveRovingKey('ArrowDown', 'vertical')).toBe('next');
    expect(resolveRovingKey('ArrowUp', 'vertical')).toBe('previous');
  });

  /*
   * Claiming both axes would swallow the arrows that scroll a page or move a
   * caret inside a text field in the group.
   */
  it('leaves the other axis alone', () => {
    expect(resolveRovingKey('ArrowDown', 'horizontal')).toBeNull();
    expect(resolveRovingKey('ArrowUp', 'horizontal')).toBeNull();
    expect(resolveRovingKey('ArrowRight', 'vertical')).toBeNull();
    expect(resolveRovingKey('ArrowLeft', 'vertical')).toBeNull();
  });

  it('jumps to the ends on Home and End, on either axis', () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      expect(resolveRovingKey('Home', orientation)).toBe('first');
      expect(resolveRovingKey('End', orientation)).toBe('last');
    }
  });

  it('returns null for keys it does not own', () => {
    for (const key of ['Enter', ' ', 'Escape', 'Tab', 'a', 'PageDown']) {
      expect(resolveRovingKey(key, 'horizontal')).toBeNull();
    }
  });
});
