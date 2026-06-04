import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

const GAP = 10;
const VIEWPORT_MARGIN = 8;

const placementFallbacks: Record<TooltipPlacement, TooltipPlacement[]> = {
  top: ['top', 'bottom', 'right', 'left'],
  bottom: ['bottom', 'top', 'right', 'left'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const getViewportSize = () => ({
  width: window.innerWidth || document.documentElement.clientWidth,
  height: window.innerHeight || document.documentElement.clientHeight,
});

const getTooltipCoordinates = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
) => {
  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;

  if (placement === 'bottom') {
    return {
      left: centerX - tooltipRect.width / 2,
      top: triggerRect.bottom + GAP,
    };
  }

  if (placement === 'left') {
    return {
      left: triggerRect.left - tooltipRect.width - GAP,
      top: centerY - tooltipRect.height / 2,
    };
  }

  if (placement === 'right') {
    return {
      left: triggerRect.right + GAP,
      top: centerY - tooltipRect.height / 2,
    };
  }

  return {
    left: centerX - tooltipRect.width / 2,
    top: triggerRect.top - tooltipRect.height - GAP,
  };
};

const getOverflow = (coordinates: { left: number; top: number }, tooltipRect: DOMRect) => {
  const viewport = getViewportSize();

  return (
    Math.max(VIEWPORT_MARGIN - coordinates.left, 0) +
    Math.max(VIEWPORT_MARGIN - coordinates.top, 0) +
    Math.max(coordinates.left + tooltipRect.width - viewport.width + VIEWPORT_MARGIN, 0) +
    Math.max(coordinates.top + tooltipRect.height - viewport.height + VIEWPORT_MARGIN, 0)
  );
};

const getTooltipPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
): { placement: TooltipPlacement; style: React.CSSProperties } => {
  const candidates = placementFallbacks[placement].map((candidatePlacement) => ({
    placement: candidatePlacement,
    coordinates: getTooltipCoordinates(triggerRect, tooltipRect, candidatePlacement),
  }));
  const bestPlacement = candidates.reduce((best, candidate) =>
    getOverflow(candidate.coordinates, tooltipRect) < getOverflow(best.coordinates, tooltipRect)
      ? candidate
      : best,
  );
  const viewport = getViewportSize();

  return {
    placement: bestPlacement.placement,
    style: {
      left: clamp(
        bestPlacement.coordinates.left,
        VIEWPORT_MARGIN,
        viewport.width - tooltipRect.width - VIEWPORT_MARGIN,
      ),
      top: clamp(
        bestPlacement.coordinates.top,
        VIEWPORT_MARGIN,
        viewport.height - tooltipRect.height - VIEWPORT_MARGIN,
      ),
      visibility: 'visible',
    },
  };
};

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { content, children, open, placement = 'top', delay = 120, disabled = false, className },
  ref,
) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => triggerRef.current as HTMLSpanElement, []);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<number | undefined>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({
    visibility: 'hidden',
  });
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>(placement);
  const isControlled = open !== undefined;
  const isVisible = !disabled && (isControlled ? open : isOpen);

  const clearShowTimer = () => {
    if (showTimerRef.current !== undefined) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }
  };

  const openTooltip = () => {
    if (disabled) {
      return;
    }

    if (isControlled) {
      return;
    }

    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const closeTooltip = () => {
    clearShowTimer();
    if (isControlled) {
      return;
    }

    setIsOpen(false);
    setStyle({ visibility: 'hidden' });
    setResolvedPlacement(placement);
  };

  useEffect(() => {
    return () => {
      clearShowTimer();
    };
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const position = getTooltipPosition(triggerRect, tooltipRect, placement);
      setStyle(position.style);
      setResolvedPlacement(position.placement);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        className="pf-tooltip__trigger"
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
        onFocus={openTooltip}
        onBlur={closeTooltip}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeTooltip();
          }
        }}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children ?? <span />}
      </span>

      {isVisible && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className={cx('pf-tooltip', `pf-tooltip--${resolvedPlacement}`, className)}
              style={style}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
});

Tooltip.displayName = 'Tooltip';
