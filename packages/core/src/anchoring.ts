import { noop } from './internal';

export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface AnchoredPositionOptions {
  /** Which edge of the anchor the floating element lines up with. Defaults to `"start"`. */
  align?: 'start' | 'end';
  /** Gap between anchor and floating element, in px. Defaults to 8. */
  offset?: number;
  /** Minimum distance kept from every viewport edge, in px. Defaults to 8. */
  viewportPadding?: number;
  /** Floor for the computed width, in px. */
  minWidth?: number;
  /** Set the floating element's `width` from the anchor rather than its `min-width`. Defaults to true. */
  matchAnchorWidth?: boolean;
  /** Flip above the anchor when there is not enough room below. Defaults to false. */
  flip?: boolean;
}

export interface AnchoredPositionStyle {
  left: number;
  top: number;
  width?: number;
  minWidth?: number;
}

/**
 * Pure geometry: given the two rects and the viewport, where does the floating
 * element go? Separated from the DOM so it can be tested directly and reused by
 * any rendering layer.
 */
export function computeAnchoredPosition(
  anchorRect: Rect,
  floatingRect: Rect | undefined,
  viewport: Viewport,
  {
    align = 'start',
    offset = 8,
    viewportPadding = 8,
    minWidth,
    matchAnchorWidth = true,
    flip = false,
  }: AnchoredPositionOptions = {},
): AnchoredPositionStyle {
  const width = Math.max(
    matchAnchorWidth ? anchorRect.width : 0,
    minWidth ?? 0,
    floatingRect?.width ?? 0,
  );
  const maxLeft = viewport.width - viewportPadding - width;
  const alignedLeft = align === 'end' ? anchorRect.right - width : anchorRect.left;
  // When the floating element is wider than the viewport allows, pin it to the
  // padding rather than clamping to a negative maximum.
  const left =
    maxLeft >= viewportPadding
      ? Math.min(Math.max(alignedLeft, viewportPadding), maxLeft)
      : viewportPadding;

  const floatingHeight = floatingRect?.height ?? 0;
  const belowTop = anchorRect.bottom + offset;
  const aboveTop = anchorRect.top - floatingHeight - offset;
  const canFlip =
    flip &&
    floatingHeight > 0 &&
    viewport.height - anchorRect.bottom < floatingHeight + offset + viewportPadding;
  const rawTop = canFlip ? aboveTop : belowTop;
  const maxTop = viewport.height - viewportPadding - floatingHeight;
  // Height is unknown on the first pass (the element has not rendered yet), so
  // clamping waits until there is something to clamp.
  const top =
    floatingHeight > 0 && maxTop >= viewportPadding
      ? Math.min(Math.max(rawTop, viewportPadding), maxTop)
      : rawTop;

  return {
    left,
    top,
    width: matchAnchorWidth ? width : undefined,
    minWidth: matchAnchorWidth ? undefined : width,
  };
}

export interface ObserveAnchoredPositionOptions extends AnchoredPositionOptions {
  getAnchor: () => HTMLElement | null | undefined;
  getFloating?: () => HTMLElement | null | undefined;
  onChange: (style: AnchoredPositionStyle) => void;
}

/**
 * Positions a floating element against an anchor, and keeps it there across
 * scroll and resize. Returns a cleanup function.
 *
 * Scroll is observed in the capture phase so that scrolling any ancestor —
 * not just the document — repositions the element.
 */
export function observeAnchoredPosition({
  getAnchor,
  getFloating,
  onChange,
  ...options
}: ObserveAnchoredPositionOptions): () => void {
  if (typeof window === 'undefined') {
    return noop;
  }

  const updatePosition = () => {
    const anchor = getAnchor();
    if (!anchor) {
      return;
    }

    onChange(
      computeAnchoredPosition(
        anchor.getBoundingClientRect(),
        getFloating?.()?.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        options,
      ),
    );
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);

  return () => {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
  };
}

/** Which side of the anchor a floating element sits on. */
export type Side = 'top' | 'bottom' | 'left' | 'right';

export interface SidePositionOptions {
  /** Preferred side. The others are tried in order when it does not fit. */
  side?: Side;
  /** Gap between anchor and floating element, in px. Defaults to 10. */
  offset?: number;
  /** Minimum distance kept from every viewport edge, in px. Defaults to 8. */
  viewportPadding?: number;
}

export interface SidePosition {
  /** The side actually used, which may not be the one asked for. */
  side: Side;
  left: number;
  top: number;
}

/**
 * Four-sided anchoring with best-fit fallback: the floating element is centred
 * on one side of the anchor, and if it would overflow the viewport there, the
 * remaining sides are tried and the least-overflowing one wins.
 *
 * Distinct from `computeAnchoredPosition`, which is the dropdown model —
 * below-or-flip-above, edge-aligned, width matched to the anchor. A tooltip or
 * a popover is centred on a side it can be on any of, which is a different
 * calculation rather than an option on the same one.
 *
 * Pure geometry, so both rendering layers produce the same placement for the
 * same rects — and so it can be tested without a DOM.
 */
export function computeSidePosition(
  anchorRect: Rect,
  floatingRect: Rect,
  viewport: Viewport,
  { side = 'top', offset = 10, viewportPadding = 8 }: SidePositionOptions = {},
): SidePosition {
  const centerX = anchorRect.left + anchorRect.width / 2;
  const centerY = anchorRect.top + anchorRect.height / 2;

  const coordinatesFor = (candidate: Side) => {
    if (candidate === 'bottom') {
      return { left: centerX - floatingRect.width / 2, top: anchorRect.bottom + offset };
    }
    if (candidate === 'left') {
      return {
        left: anchorRect.left - floatingRect.width - offset,
        top: centerY - floatingRect.height / 2,
      };
    }
    if (candidate === 'right') {
      return { left: anchorRect.right + offset, top: centerY - floatingRect.height / 2 };
    }
    return {
      left: centerX - floatingRect.width / 2,
      top: anchorRect.top - floatingRect.height - offset,
    };
  };

  /** How far outside the padded viewport this placement would reach, in px. */
  const overflowOf = ({ left, top }: { left: number; top: number }) =>
    Math.max(viewportPadding - left, 0) +
    Math.max(viewportPadding - top, 0) +
    Math.max(left + floatingRect.width - viewport.width + viewportPadding, 0) +
    Math.max(top + floatingRect.height - viewport.height + viewportPadding, 0);

  // The opposite side is tried first, then the perpendicular pair: flipping is
  // the least surprising correction, and it keeps the arrow on the same axis.
  const order: Record<Side, Side[]> = {
    top: ['top', 'bottom', 'right', 'left'],
    bottom: ['bottom', 'top', 'right', 'left'],
    left: ['left', 'right', 'top', 'bottom'],
    right: ['right', 'left', 'top', 'bottom'],
  };

  const best = order[side]
    .map((candidate) => ({ side: candidate, coordinates: coordinatesFor(candidate) }))
    // `reduce` rather than a sort, so ties keep the earlier (more preferred) side.
    .reduce((winner, candidate) =>
      overflowOf(candidate.coordinates) < overflowOf(winner.coordinates) ? candidate : winner,
    );

  /*
   * Clamp after choosing. Even the best side can still overflow — a viewport
   * narrower than the floating element has no good placement — and pinning to
   * the padding keeps it on screen rather than half off it.
   */
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max));

  return {
    side: best.side,
    left: clamp(
      best.coordinates.left,
      viewportPadding,
      viewport.width - floatingRect.width - viewportPadding,
    ),
    top: clamp(
      best.coordinates.top,
      viewportPadding,
      viewport.height - floatingRect.height - viewportPadding,
    ),
  };
}

export interface ObserveSidePositionOptions extends SidePositionOptions {
  getAnchor: () => HTMLElement | null | undefined;
  getFloating: () => HTMLElement | null | undefined;
  onChange: (position: SidePosition) => void;
}

/**
 * Keeps a four-sided floating element against its anchor across scroll and
 * resize. Returns a cleanup function.
 *
 * The sibling of `observeAnchoredPosition` for the side model. Scroll is
 * observed in the capture phase so scrolling any ancestor repositions the
 * element, not only the document — a tooltip inside a scrolling panel would
 * otherwise stay where the panel used to be.
 */
export function observeSidePosition({
  getAnchor,
  getFloating,
  onChange,
  ...options
}: ObserveSidePositionOptions): () => void {
  if (typeof window === 'undefined') {
    return noop;
  }

  const updatePosition = () => {
    const anchor = getAnchor();
    const floating = getFloating();
    // Both rects are needed: the side is chosen by how the floating element's
    // own size fits, so there is nothing to compute until it has rendered.
    if (!anchor || !floating) {
      return;
    }

    onChange(
      computeSidePosition(
        anchor.getBoundingClientRect(),
        floating.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        options,
      ),
    );
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);

  return () => {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Keep a floating element of `size` inside the padded viewport when it is
 * placed at `point` — a context menu opened under the pointer, which has no
 * anchor element to flip around.
 *
 * Pinned to the padding rather than inverted: a right-click near the bottom
 * edge should put the menu just above that edge, not jump it above the cursor,
 * because the pointer is already where the user is looking.
 */
export function clampToViewport(point: Point, size: Size, viewport: Viewport, padding = 8): Point {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max));

  return {
    x: clamp(point.x, padding, viewport.width - size.width - padding),
    y: clamp(point.y, padding, viewport.height - size.height - padding),
  };
}
