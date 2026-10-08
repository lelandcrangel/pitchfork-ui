/**
 * How a tree view is walked: which nodes are visible, and what a key does
 * from where the focus is.
 *
 * Shared because the ARIA tree pattern is a set of rules rather than an
 * implementation — Right expands a closed branch and *moves into* an open
 * one, Left collapses an open branch and moves *out of* a leaf — and a React
 * `TreeView` and a `<pf-tree-view>` that disagreed about any of them would
 * be two controls wearing one name.
 */

/** The parts of a tree node these rules need. */
export interface TreeNodeLike {
  value: string;
  disabled?: boolean;
  children?: readonly TreeNodeLike[];
}

/** One node as it appears in the visible list, with where it sits. */
export interface FlatTreeNode<T extends TreeNodeLike = TreeNodeLike> {
  node: T;
  /** 1 for a root node, 2 for its children, and so on. */
  level: number;
  parentValue?: string;
  hasChildren: boolean;
  expanded: boolean;
}

/**
 * The nodes a reader can actually see, in the order they are rendered —
 * depth-first, with a closed branch's children left out.
 *
 * One flat list rather than a recursive walk per key, because every one of the
 * keyboard rules is "the next visible node" or "the previous" one, and those
 * are neighbours here.
 */
export function flattenVisibleTree<T extends TreeNodeLike>(
  nodes: readonly T[],
  expanded: ReadonlySet<string> | readonly string[],
  level = 1,
  parentValue?: string,
): FlatTreeNode<T>[] {
  const open = expanded instanceof Set ? expanded : new Set(expanded);
  const flattened: FlatTreeNode<T>[] = [];

  for (const node of nodes) {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = hasChildren && open.has(node.value);
    flattened.push({ node, level, parentValue, hasChildren, expanded: isExpanded });

    if (isExpanded) {
      flattened.push(
        ...flattenVisibleTree(node.children as readonly T[], open, level + 1, node.value),
      );
    }
  }

  return flattened;
}

/** The first node a reader can select, looking into closed branches too. */
export function firstEnabledTreeValue(nodes: readonly TreeNodeLike[]): string | undefined {
  for (const node of nodes) {
    if (!node.disabled) return node.value;
    if (node.children && node.children.length > 0) {
      const inside = firstEnabledTreeValue(node.children);
      if (inside) return inside;
    }
  }
  return undefined;
}

/** Every node that has children, which is what "expand all" opens. */
export function expandableTreeValues(nodes: readonly TreeNodeLike[]): string[] {
  const values: string[] = [];

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      values.push(node.value);
      values.push(...expandableTreeValues(node.children));
    }
  }

  return values;
}

/** What a key asks the tree to do. */
export type TreeIntent =
  | { type: 'focus'; value: string }
  | { type: 'expand'; value: string }
  | { type: 'collapse'; value: string }
  | { type: 'activate'; value: string };

/**
 * What a key does, given the visible list and where the focus is — or `null`
 * when the key is not the tree's to handle.
 *
 * Returned as an intent rather than performed, so both layers share every
 * rule and differ only in how they move focus and set state. The two rules
 * worth stating are the horizontal ones, which are the ARIA pattern:
 *
 * - Right opens a closed branch, and on an open one moves to its first child.
 *   On a leaf it does nothing, rather than skipping to the next sibling.
 * - Left closes an open branch, and on anything else moves out to the parent.
 *
 * Enter and Space select, and also toggle a branch — which is the React
 * component's behaviour, and the reason this returns one intent at a time:
 * the caller does the selection itself and asks again for the toggle.
 */
export function resolveTreeKey(
  key: string,
  flattened: readonly FlatTreeNode[],
  currentIndex: number,
): TreeIntent | null {
  const current = flattened[currentIndex];
  if (!current) return null;

  const at = (index: number) => flattened[index]?.node.value;

  switch (key) {
    case 'ArrowDown': {
      const next = at(currentIndex + 1);
      return next ? { type: 'focus', value: next } : null;
    }
    case 'ArrowUp': {
      const previous = at(currentIndex - 1);
      return previous ? { type: 'focus', value: previous } : null;
    }
    case 'ArrowRight': {
      if (!current.hasChildren) return null;
      if (!current.expanded) return { type: 'expand', value: current.node.value };
      const child = flattened[currentIndex + 1];
      return child && child.parentValue === current.node.value
        ? { type: 'focus', value: child.node.value }
        : null;
    }
    case 'ArrowLeft': {
      if (current.hasChildren && current.expanded) {
        return { type: 'collapse', value: current.node.value };
      }
      return current.parentValue ? { type: 'focus', value: current.parentValue } : null;
    }
    case 'Home': {
      const first = at(0);
      return first ? { type: 'focus', value: first } : null;
    }
    case 'End': {
      const last = at(flattened.length - 1);
      return last ? { type: 'focus', value: last } : null;
    }
    case 'Enter':
    case ' ':
      return { type: 'activate', value: current.node.value };
    default:
      return null;
  }
}
