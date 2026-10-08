import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TreeView, TreeViewHandle, TreeViewNode } from './TreeView';

const simpleNodes: TreeViewNode[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const nestedNodes: TreeViewNode[] = [
  {
    value: 'parent',
    label: 'Parent',
    children: [
      { value: 'child-1', label: 'Child 1' },
      { value: 'child-2', label: 'Child 2' },
    ],
  },
  { value: 'sibling', label: 'Sibling' },
];

const deepNodes: TreeViewNode[] = [
  {
    value: 'root',
    label: 'Root',
    children: [
      {
        value: 'mid',
        label: 'Mid',
        children: [{ value: 'leaf', label: 'Leaf' }],
      },
    ],
  },
];

describe('TreeView', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders the tree role', () => {
    render(<TreeView nodes={simpleNodes} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('renders treeitem for each node', () => {
    render(<TreeView nodes={simpleNodes} />);
    expect(screen.getAllByRole('treeitem')).toHaveLength(3);
  });

  it('renders node labels', () => {
    render(<TreeView nodes={simpleNodes} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('sets aria-level=1 on root nodes', () => {
    render(<TreeView nodes={simpleNodes} />);
    screen.getAllByRole('treeitem').forEach((item) => {
      expect(item).toHaveAttribute('aria-level', '1');
    });
  });

  // ─── Nested structure ────────────────────────────────────────────────────

  it('hides children until parent is expanded', () => {
    render(<TreeView nodes={nestedNodes} />);
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child 2')).not.toBeInTheDocument();
  });

  it('sets aria-expanded=false on collapsed parent', () => {
    render(<TreeView nodes={nestedNodes} />);
    expect(screen.getByRole('treeitem', { name: 'Parent' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('does not set aria-expanded on leaf nodes', () => {
    render(<TreeView nodes={simpleNodes} />);
    screen.getAllByRole('treeitem').forEach((item) => {
      expect(item).not.toHaveAttribute('aria-expanded');
    });
  });

  it('shows children at aria-level=2 after expansion', () => {
    render(<TreeView nodes={nestedNodes} defaultExpandedValues={['parent']} />);
    const child1 = screen.getByRole('treeitem', { name: 'Child 1' });
    expect(child1).toHaveAttribute('aria-level', '2');
  });

  // ─── Expand / collapse ───────────────────────────────────────────────────

  it('expands a node when Enter is pressed on it', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nestedNodes} />);
    screen.getByRole('treeitem', { name: 'Parent' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('collapses an expanded node when Enter is pressed on it again', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nestedNodes} defaultExpandedValues={['parent']} />);
    screen.getByRole('treeitem', { name: 'Parent' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
  });

  it('calls onExpandedValuesChange when a node is toggled', async () => {
    const user = userEvent.setup();
    const onExpandedValuesChange = vi.fn();
    render(<TreeView nodes={nestedNodes} onExpandedValuesChange={onExpandedValuesChange} />);
    screen.getByRole('treeitem', { name: 'Parent' }).focus();
    await user.keyboard('{Enter}');
    expect(onExpandedValuesChange).toHaveBeenCalledWith(['parent']);
  });

  // ─── Selection ───────────────────────────────────────────────────────────

  it('marks the selected node with aria-selected=true', () => {
    render(<TreeView nodes={simpleNodes} selectedValue="b" />);
    expect(screen.getByRole('treeitem', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks non-selected nodes with aria-selected=false', () => {
    render(<TreeView nodes={simpleNodes} selectedValue="b" />);
    expect(screen.getByRole('treeitem', { name: 'Alpha' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onSelectedValueChange when a node is clicked', async () => {
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    render(<TreeView nodes={simpleNodes} onSelectedValueChange={onSelectedValueChange} />);
    await user.click(screen.getByRole('treeitem', { name: 'Beta' }));
    expect(onSelectedValueChange).toHaveBeenCalledWith('b');
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('ArrowDown moves focus to the next node', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={simpleNodes} />);
    const [alpha, beta] = screen.getAllByRole('treeitem');
    alpha.focus();
    await user.keyboard('{ArrowDown}');
    expect(beta).toHaveFocus();
  });

  it('ArrowUp moves focus to the previous node', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={simpleNodes} />);
    const [alpha, beta] = screen.getAllByRole('treeitem');
    beta.focus();
    await user.keyboard('{ArrowUp}');
    expect(alpha).toHaveFocus();
  });

  it('ArrowRight expands a collapsed parent', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nestedNodes} />);
    screen.getByRole('treeitem', { name: 'Parent' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Child 1')).toBeInTheDocument();
  });

  it('ArrowLeft collapses an expanded parent', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nestedNodes} defaultExpandedValues={['parent']} />);
    screen.getByRole('treeitem', { name: 'Parent' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
  });

  it('ArrowLeft on a child focuses the parent', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nestedNodes} defaultExpandedValues={['parent']} />);
    screen.getByRole('treeitem', { name: 'Child 1' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('treeitem', { name: 'Parent' })).toHaveFocus();
  });

  it('Home moves focus to the first node', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={simpleNodes} />);
    const [alpha, , gamma] = screen.getAllByRole('treeitem');
    gamma.focus();
    await user.keyboard('{Home}');
    expect(alpha).toHaveFocus();
  });

  it('End moves focus to the last visible node', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={simpleNodes} />);
    const [alpha, , gamma] = screen.getAllByRole('treeitem');
    alpha.focus();
    await user.keyboard('{End}');
    expect(gamma).toHaveFocus();
  });

  it('Enter selects a node', async () => {
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    render(<TreeView nodes={simpleNodes} onSelectedValueChange={onSelectedValueChange} />);
    screen.getByRole('treeitem', { name: 'Gamma' }).focus();
    await user.keyboard('{Enter}');
    expect(onSelectedValueChange).toHaveBeenCalledWith('c');
  });

  // ─── Imperative handle ───────────────────────────────────────────────────

  it('expandAll reveals all nested nodes', () => {
    const ref = createRef<TreeViewHandle>();
    render(<TreeView ref={ref} nodes={deepNodes} />);
    act(() => ref.current!.expandAll());
    expect(screen.getByText('Leaf')).toBeInTheDocument();
  });

  it('collapseAll hides all nested nodes', () => {
    const ref = createRef<TreeViewHandle>();
    render(<TreeView ref={ref} nodes={deepNodes} defaultExpandedValues={['root', 'mid']} />);
    act(() => ref.current!.collapseAll());
    expect(screen.queryByText('Mid')).not.toBeInTheDocument();
    expect(screen.queryByText('Leaf')).not.toBeInTheDocument();
  });

  /* ─── One tab stop ─────────────────────────────────────────────────────── *
   *
   * Every visible item was tabbable, so a tree of thirty open nodes was thirty
   * stops in the page's tab order. The ARIA tree pattern is one stop with the
   * arrows moving inside — the arrows were already there.
   */

  const stops = () =>
    screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0');

  it('has one tab stop however many items are visible', () => {
    render(<TreeView nodes={deepNodes} defaultExpandedValues={['root', 'mid']} />);

    expect(screen.getAllByRole('treeitem').length).toBeGreaterThan(2);
    expect(stops()).toHaveLength(1);
  });

  it('puts the tab stop on the selected item', () => {
    render(<TreeView nodes={simpleNodes} defaultSelectedValue="b" />);
    expect(stops()[0]).toHaveAccessibleName('Beta');
  });

  it('tabs in from outside onto the selection, not onto the first item', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <TreeView nodes={simpleNodes} defaultSelectedValue="c" />
      </>,
    );

    screen.getByRole('button', { name: 'Before' }).focus();
    await user.tab();

    expect(screen.getByRole('treeitem', { name: 'Gamma' })).toHaveFocus();
  });

  it('moves the tab stop with the arrows', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={simpleNodes} />);
    screen.getByRole('treeitem', { name: 'Alpha' }).focus();

    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('treeitem', { name: 'Beta' })).toHaveFocus();
    expect(stops()[0]).toHaveAccessibleName('Beta');
  });

  /*
   * Collapsing a branch takes its children off screen. A tab stop left on one
   * of them leaves the tree with no stop at all — reachable by mouse and by
   * nothing else — which is why the active item is derived against the visible
   * list rather than stored outright.
   *
   * It has to be collapsed from *outside* the keyboard to catch this: walking
   * out of a branch with ArrowLeft moves focus to the parent first, so the
   * stored value is never stale on that path. `collapseAll()` is the case that
   * is, and so is a click on the toggle chevron.
   */
  it('keeps a tab stop when the focused item is collapsed away', () => {
    const ref = createRef<TreeViewHandle>();
    render(<TreeView ref={ref} nodes={nestedNodes} defaultExpandedValues={['parent']} />);

    // In `act`, because the item's own `onFocus` is what moves the tab stop.
    act(() => screen.getByRole('treeitem', { name: 'Child 1' }).focus());
    expect(stops()[0]).toHaveAccessibleName('Child 1');

    act(() => ref.current!.collapseAll());

    expect(screen.queryByRole('treeitem', { name: 'Child 1' })).not.toBeInTheDocument();
    expect(stops()).toHaveLength(1);
    expect(stops()[0]).toHaveAccessibleName('Parent');
  });

  /*
   * Core's `resolveTreeKey` returns a focus intent for a disabled node — the
   * ARIA pattern is that focus moves freely while activation refuses — and a
   * `disabled` button cannot take focus, so arrowing onto one used to drop
   * focus out of the tree entirely.
   */
  it('focuses a disabled item but will not select it', async () => {
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    render(
      <TreeView
        nodes={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta', disabled: true },
          { value: 'c', label: 'Gamma' },
        ]}
        onSelectedValueChange={onSelectedValueChange}
      />,
    );

    const beta = screen.getByRole('treeitem', { name: 'Beta' });
    expect(beta).toHaveAttribute('aria-disabled', 'true');
    expect(beta).not.toBeDisabled();

    screen.getByRole('treeitem', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(beta).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onSelectedValueChange).not.toHaveBeenCalled();

    // And the keyboard can carry on past it.
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectedValueChange).toHaveBeenCalledWith('c');
  });
});
