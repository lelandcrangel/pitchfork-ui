/**
 * Chromium itself, for a browser spec: its accessibility tree, and trusted
 * input by coordinates.
 *
 * Playwright's `getByRole` computes names itself, and it does not follow ARIA
 * element reflection (`ariaLabelledByElements` and friends) — the one way a
 * dialog in a shadow root can be named by slotted content. Measured on
 * `pf-modal`: after `show()` the locator found no dialog named "Confirm",
 * while Chromium's tree reported exactly that. A check through the locator
 * would call a working dialog unnamed, or, where an `aria-label` copy happens
 * to exist, pass without ever looking at the reference.
 *
 * Specs run inside an iframe, so every frame is asked.
 */
import { cdp } from 'vitest/browser';

export interface AxNode {
  role: string;
  name: string;
  description: string;
}

interface RawNode {
  role?: { value?: string };
  name?: { value?: string };
  description?: { value?: string };
  ignored?: boolean;
}

interface FrameTree {
  frame: { id: string };
  childFrames?: FrameTree[];
}

/** Every unignored node with `role`, as Chromium reports it. */
export async function axNodesWithRole(role: string): Promise<AxNode[]> {
  const session = cdp();
  await session.send('Accessibility.enable');
  const { frameTree } = (await session.send('Page.getFrameTree')) as { frameTree: FrameTree };
  const frames: string[] = [];
  const walk = (tree: FrameTree) => {
    frames.push(tree.frame.id);
    tree.childFrames?.forEach(walk);
  };
  walk(frameTree);

  const found: AxNode[] = [];
  for (const frameId of frames) {
    const { nodes } = (await session.send('Accessibility.getFullAXTree', { frameId })) as {
      nodes: RawNode[];
    };
    for (const node of nodes) {
      if (node.ignored || node.role?.value !== role) continue;
      found.push({
        role,
        name: node.name?.value ?? '',
        description: node.description?.value ?? '',
      });
    }
  }
  return found;
}

/**
 * A trusted click at a point inside `element`, by coordinates.
 *
 * `userEvent.click(element)` turns the element into a locator first, and for
 * a dialog that locator is its role and accessible name — the name the
 * locator engine cannot see when it comes from an element reference. So the
 * click found the dialog only while the first render's copied `aria-label`
 * was still there, and timed out at 15s whenever the re-render had already
 * removed it: a flake that appeared only under a full run's load. A point
 * needs no locator. Specs run in an iframe, and CDP's coordinates are the top
 * page's, so the frame's offset is added.
 */
export async function clickAt(element: Element, x: number, y: number): Promise<void> {
  const box = element.getBoundingClientRect();
  // The runner may scale the iframe to fit, so a point inside it is scaled
  // by the frame's drawn width over its own.
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const point = {
    x: (frame?.left ?? 0) + (box.left + x) * scale,
    y: (frame?.top ?? 0) + (box.top + y) * scale,
  };
  const session = cdp();
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await session.send('Input.dispatchMouseEvent', {
      type,
      ...point,
      button: 'left',
      clickCount: type === 'mouseMoved' ? 0 : 1,
    });
  }
}
