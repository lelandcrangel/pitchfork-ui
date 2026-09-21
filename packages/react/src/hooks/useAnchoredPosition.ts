import { observeAnchoredPosition, type AnchoredPositionOptions } from '@pitchfork-ui/core';
import { useEffect, useState } from 'react';

export interface UseAnchoredPositionOptions extends AnchoredPositionOptions {
  anchorRef: React.RefObject<HTMLElement | null>;
  floatingRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
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
    if (!enabled) {
      return;
    }

    return observeAnchoredPosition({
      getAnchor: () => anchorRef.current,
      getFloating: floatingRef ? () => floatingRef.current : undefined,
      onChange: (next) => setStyle(next),
      align,
      offset,
      viewportPadding,
      minWidth,
      matchAnchorWidth,
      flip,
    });
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
