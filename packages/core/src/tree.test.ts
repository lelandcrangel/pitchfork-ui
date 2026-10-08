import { describe, expect, it } from 'vitest';
import {
  expandableTreeValues,
  firstEnabledTreeValue,
  flattenVisibleTree,
  resolveTreeKey,
} from './tree';

const tree = [
  {
    value: 'src',
    children: [{ value: 'index.ts' }, { value: 'components', children: [{ value: 'Button.tsx' }] }],
  },
  { value: 'package.json' },
];

const flat = (expanded: string[]) => flattenVisibleTree(tree, expanded);
const values = (expanded: string[]) => flat(expanded).map((item) => item.node.value);

describe('flattenVisibleTree', () => {
  it('leaves a closed branch’s children out', () => {
    expect(values([])).toEqual(['src', 'package.json']);
  });

  it('shows an open branch’s children, in depth-first order', () => {
    expect(values(['src'])).toEqual(['src', 'index.ts', 'components', 'package.json']);
    expect(values(['src', 'components'])).toEqual([
      'src',
      'index.ts',
      'components',
      'Button.tsx',
      'package.json',
    ]);
  });

  it('records the level, the parent, and whether a node is a branch', () => {
    const [root, , branch, leaf] = flat(['src', 'components']);
    expect(root).toMatchObject({ level: 1, parentValue: undefined, hasChildren: true });
    expect(branch).toMatchObject({ level: 2, parentValue: 'src', hasChildren: true });
    expect(leaf).toMatchObject({ level: 3, parentValue: 'components', hasChildren: false });
  });

  /* An expanded leaf is not expanded: there is nothing to open. */
  it('does not call a leaf expanded, whatever it is told', () => {
    expect(flat(['package.json'])[1]).toMatchObject({ hasChildren: false, expanded: false });
  });

  it('takes a set as readily as a list', () => {
    expect(flattenVisibleTree(tree, new Set(['src'])).map((item) => item.node.value)).toEqual(
      values(['src']),
    );
  });
});

describe('firstEnabledTreeValue', () => {
  it('takes the first node that is not disabled', () => {
    expect(firstEnabledTreeValue(tree)).toBe('src');
  });

  /* Looking inside a disabled branch, which may hold something selectable. */
  it('looks into a disabled branch', () => {
    expect(
      firstEnabledTreeValue([
        { value: 'locked', disabled: true, children: [{ value: 'inside' }] },
        { value: 'after' },
      ]),
    ).toBe('inside');
  });

  it('has nothing to take from an empty or wholly disabled tree', () => {
    expect(firstEnabledTreeValue([])).toBeUndefined();
    expect(firstEnabledTreeValue([{ value: 'a', disabled: true }])).toBeUndefined();
  });
});

describe('expandableTreeValues', () => {
  it('lists every branch, at every depth', () => {
    expect(expandableTreeValues(tree)).toEqual(['src', 'components']);
  });

  it('lists nothing for a flat tree', () => {
    expect(expandableTreeValues([{ value: 'a' }, { value: 'b' }])).toEqual([]);
  });
});

describe('resolveTreeKey', () => {
  const open = flat(['src']);

  it('moves down and up the visible list', () => {
    expect(resolveTreeKey('ArrowDown', open, 0)).toEqual({ type: 'focus', value: 'index.ts' });
    expect(resolveTreeKey('ArrowUp', open, 1)).toEqual({ type: 'focus', value: 'src' });
  });

  it('stops at both ends', () => {
    expect(resolveTreeKey('ArrowUp', open, 0)).toBeNull();
    expect(resolveTreeKey('ArrowDown', open, open.length - 1)).toBeNull();
  });

  /* The ARIA rule: Right opens a closed branch and moves into an open one. */
  it('opens a closed branch, then moves into it', () => {
    expect(resolveTreeKey('ArrowRight', flat([]), 0)).toEqual({ type: 'expand', value: 'src' });
    expect(resolveTreeKey('ArrowRight', open, 0)).toEqual({ type: 'focus', value: 'index.ts' });
  });

  it('does nothing on a leaf, rather than skipping to the next node', () => {
    expect(resolveTreeKey('ArrowRight', open, 1)).toBeNull();
  });

  it('closes an open branch, and otherwise moves out to the parent', () => {
    expect(resolveTreeKey('ArrowLeft', open, 0)).toEqual({ type: 'collapse', value: 'src' });
    expect(resolveTreeKey('ArrowLeft', open, 1)).toEqual({ type: 'focus', value: 'src' });
    // A root leaf has nowhere to go.
    expect(resolveTreeKey('ArrowLeft', open, 3)).toBeNull();
  });

  it('jumps to the first and last visible node', () => {
    expect(resolveTreeKey('Home', open, 2)).toEqual({ type: 'focus', value: 'src' });
    expect(resolveTreeKey('End', open, 0)).toEqual({ type: 'focus', value: 'package.json' });
  });

  it('activates on Enter and Space', () => {
    expect(resolveTreeKey('Enter', open, 1)).toEqual({ type: 'activate', value: 'index.ts' });
    expect(resolveTreeKey(' ', open, 1)).toEqual({ type: 'activate', value: 'index.ts' });
  });

  it('leaves every other key alone', () => {
    expect(resolveTreeKey('a', open, 0)).toBeNull();
    expect(resolveTreeKey('Escape', open, 0)).toBeNull();
  });

  it('has nothing to say when the focus is nowhere', () => {
    expect(resolveTreeKey('ArrowDown', open, -1)).toBeNull();
  });
});
