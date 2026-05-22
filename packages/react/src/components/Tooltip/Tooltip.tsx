import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

const GAP = 10;

const getTooltipStyle = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
): React.CSSProperties => {
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

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 120,
  disabled = false,
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<number | undefined>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

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

    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const closeTooltip = () => {
    clearShowTimer();
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      clearShowTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setStyle(getTooltipStyle(triggerRect, tooltipRect, placement));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, placement]);

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
        aria-describedby={isOpen ? tooltipId : undefined}
      >
        {children ?? <span />}
      </span>

      {isOpen && !disabled && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className={cx('pf-tooltip', `pf-tooltip--${placement}`, className)}
              style={style}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
