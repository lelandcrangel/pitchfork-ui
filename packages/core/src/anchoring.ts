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
