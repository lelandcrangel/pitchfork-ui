import { useEffect, useState } from 'react';

export interface UseAnchoredPositionOptions {
  anchorRef: React.RefObject<HTMLElement | null>;
  floatingRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  align?: 'start' | 'end';
  offset?: number;
  viewportPadding?: number;
  minWidth?: number;
  matchAnchorWidth?: boolean;
  flip?: boolean;
}

export function useAnchoredPosition({
  anchorRef,
  floatingRef,
  enabled = true,
  align = 'start',
  offset = 8,
  viewportPadding = 8,
  minWidth,
  matchAnchorWidth = true,
  flip = false,
}: UseAnchoredPositionOptions) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const floatingRect = floatingRef?.current?.getBoundingClientRect();
      const width = Math.max(
        matchAnchorWidth ? anchorRect.width : 0,
        minWidth ?? 0,
        floatingRect?.width ?? 0,
      );
      const maxLeft = window.innerWidth - viewportPadding - width;
      const alignedLeft =
        align === 'end' ? anchorRect.right - width : anchorRect.left;
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
        window.innerHeight - anchorRect.bottom <
          floatingHeight + offset + viewportPadding;
      const rawTop = canFlip ? aboveTop : belowTop;
      const maxTop = window.innerHeight - viewportPadding - floatingHeight;
      const top =
        floatingHeight > 0 && maxTop >= viewportPadding
          ? Math.min(Math.max(rawTop, viewportPadding), maxTop)
          : rawTop;

      setStyle({
        left,
        top,
        width: matchAnchorWidth ? width : undefined,
        minWidth: matchAnchorWidth ? undefined : width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [
    align,
    anchorRef,
    enabled,
    floatingRef,
    flip,
    matchAnchorWidth,
    minWidth,
    offset,
    viewportPadding,
  ]);

  return style;
}
